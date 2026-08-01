import { Injectable, BadRequestException } from '@nestjs/common';
import { RealtimeGateway } from '../../../common/realtime/realtime.gateway';
import { PrismaService } from '../../../config/prisma.service';
import { TransitionService } from '../../../common/services/transition.service';
import { Prisma, PunchType } from '@prisma/client';
import { GovernanceEventPublisher } from '../../governance-events/governance-event.publisher';
import { DomainEventTypes } from '../../governance-events/types/events';
import { RedisService } from '../../../config/redis.service';
import * as crypto from 'crypto';
import { AttendanceHistoryService } from './attendance-history.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import {
  getCompanyTz,
  getTodayInTz,
  getTimeInTz,
  getDateStringInTz,
} from '../../../common/utils/company-time';
import { EmployeesService } from '../employees/employees.service';
import { LeaveRequestsService } from '../leave-requests/leave-requests.service';

const EARTH_RADIUS_M = 6_371_000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private eventPublisher: GovernanceEventPublisher,
    private historyService: AttendanceHistoryService,
    private redis: RedisService,
    private transitionService: TransitionService,
    private employeesService: EmployeesService,
    private leaveRequestsService: LeaveRequestsService,
    private realtimeGateway: RealtimeGateway,
  ) {}

  private pushToCompany(companyId: string, data: unknown) {
    this.realtimeGateway.broadcastToCompany(companyId, 'attendance', data);
  }

  async generateNonce(
    employeeId: string,
    companyId: string,
  ): Promise<{ nonce: string }> {
    const rateLimitKey = `attendance:nonce-ratelimit:${companyId}:${employeeId}`;
    const recentCount = await this.redis.get<string>(rateLimitKey);
    if (recentCount && parseInt(recentCount, 10) >= 5) {
      throw new BadRequestException(
        'Too many nonce requests. Please wait before requesting again.',
      );
    }

    const nonce = crypto.randomBytes(16).toString('hex');
    const key = `attendance:nonce:${companyId}:${employeeId}`;
    await this.redis.set(key, nonce, 60); // 60 seconds TTL

    // Rate limit: allow max 5 nonce requests per 60 seconds
    const currentCount = parseInt(recentCount ?? '0', 10) + 1;
    await this.redis.set(rateLimitKey, String(currentCount), 60);

    return { nonce };
  }

  async getMyAttendance(employeeId: string, companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { settings: true },
    });
    const tz = getCompanyTz(
      company?.settings as Record<string, unknown> | null,
    );

    // Fallback reading from AttendanceDayAggregate and Session
    const records = await this.prisma.attendanceDayAggregate.findMany({
      where: { employeeId, companyId },
      orderBy: { date: 'desc' },
      take: 60,
      include: {
        attendanceSessions: true,
      },
    });

    return {
      today: getDateStringInTz(tz),
      records,
    };
  }

  async punch(
    employeeId: string,
    companyId: string,
    dto: {
      punchType: PunchType;
      timestamp?: string;
      deviceId?: string;
      locationId?: string;
      payloadHash?: string;
      latitude?: number;
      longitude?: number;
      gpsAccuracy?: number;
      mockLocationDetected?: boolean;
      developerModeActive?: boolean;
      photoUrl?: string;
      nonce: string;
    },
    ipAddress?: string,
  ) {
    const timestamp = new Date();

    // 2. Validate Employee & Rules (outside transaction — read-only)
    const employee = await this.employeesService.findByIdWithCompanySettings(
      employeeId,
      companyId,
    );
    if (!employee)
      throw new BadRequestException('Employee not found in this company');

    // 3.1 Office IP + GPS geofence validation
    let locationMismatch = false;
    if (employee.staffType === 'OFFICE') {
      const officeLocations = await this.prisma.officeLocation.findMany({
        where: { companyId, isActive: true },
      });
      if (officeLocations.length > 0 && ipAddress) {
        const allowedIps = officeLocations
          .map((loc) => loc.ipAddress)
          .filter((ip) => !!ip);
        if (allowedIps.length > 0 && !allowedIps.includes(ipAddress)) {
          throw new BadRequestException(
            'Unauthorized IP address for office staff',
          );
        }
      }
      // §5.3.2: flag GPS punches that fall outside all configured office locations
      if (
        dto.latitude !== undefined &&
        dto.longitude !== undefined &&
        officeLocations.length > 0
      ) {
        const withinAnyOffice = officeLocations.some((loc) => {
          if (loc.latitude == null || loc.longitude == null || loc.radius == null) {
            return false;
          }
          const distance = haversineDistance(
            dto.latitude!,
            dto.longitude!,
            Number(loc.latitude),
            Number(loc.longitude),
          );
          return distance <= loc.radius;
        });
        if (!withinAnyOffice) {
          locationMismatch = true;
        }
      }
    }

    // 3.2 Server Nonce Validation (mandatory — prevents replay attacks)
    const nonceKey = `attendance:nonce:${companyId}:${employeeId}`;
    const storedNonce = await this.redis.get<string>(nonceKey);
    if (!storedNonce || dto.nonce !== storedNonce) {
      throw new BadRequestException('Invalid or expired nonce');
    }
    await this.redis.del(nonceKey); // Consume nonce (one-time use)

    // 3.3 GPS Geofence Validation for Field Staff
    let matchedGeofenceId: string | null = null;
    if (employee.staffType === 'FIELD') {
      if (dto.latitude === undefined || dto.longitude === undefined) {
        throw new BadRequestException(
          'Location coordinates are required for field staff',
        );
      }
      const geofences = await this.prisma.geofenceVersion.findMany({
        where: { companyId },
      });
      if (geofences.length > 0) {
        let isWithinAny = false;
        for (const gf of geofences) {
          const distance = haversineDistance(
            dto.latitude,
            dto.longitude,
            Number(gf.latitude),
            Number(gf.longitude),
          );
          if (distance <= gf.radiusMeters) {
            isWithinAny = true;
            matchedGeofenceId = gf.id;
            break;
          }
        }
        if (!isWithinAny) {
          throw new BadRequestException(
            'Punch location is outside allowed geofences',
          );
        }
      }
    }

    // 3.4 Mandatory Selfie Evidence
    if (!dto.photoUrl) {
      throw new BadRequestException('Selfie evidence is mandatory');
    }

    const s = (employee.companies.settings as Record<string, unknown>) ?? {};
    const tz = getCompanyTz(s);
    const today = getTodayInTz(tz);

    const approvedLeave =
      await this.leaveRequestsService.findApprovedLeaveForDate(
        employeeId,
        companyId,
        today,
      );
    if (
      approvedLeave &&
      (dto.punchType === 'IN' || dto.punchType === 'BREAK_END')
    ) {
      throw new BadRequestException(
        'Cannot punch in: you have an approved leave for today',
      );
    }

    // 3. Atomic write: punch + evidence + session + domain event
    const result = await this.prisma.$transaction(async (tx) => {
      const punch = await tx.attendancePunch.create({
        data: {
          companyId,
          employeeId,
          punchType: dto.punchType,
          timestamp,
          deviceId: dto.deviceId,
          locationId: dto.locationId,
          latitude: dto.latitude,
          longitude: dto.longitude,
          payloadHash: dto.payloadHash,
          locationMismatch,
        },
      });

      if (dto.photoUrl) {
        const storageObj = await tx.storageObject.create({
          data: {
            companyId,
            storageProvider: process.env.S3_ENDPOINT || 'LOCAL',
            bucketName: process.env.S3_BUCKET || 'uploads',
            objectKey: dto.photoUrl,
            objectVersion: '1',
          },
        });
        const evidence = await tx.attendanceEvidence.create({
          data: {
            companyId,
            punchId: punch.id,
            type: 'SELFIE',
            storageObjectId: storageObj.id,
            geofenceVersionId: matchedGeofenceId,
            gpsAccuracy: dto.gpsAccuracy,
            mockLocationDetected: dto.mockLocationDetected ?? false,
            developerModeActive: dto.developerModeActive ?? false,
          },
        });

        await tx.attendanceEvidenceReview.create({
          data: {
            companyId,
            evidenceId: evidence.id,
            punchId: punch.id,
            reviewedById: '',
            status: 'PENDING',
          },
        });

        await this.eventPublisher.publish(tx, {
          eventType: DomainEventTypes.ATTENDANCE_EVIDENCE_PENDING,
          entityId: evidence.id,
          entityType: 'AttendanceEvidence',
          companyId,
          payload: {
            companyId,
            employeeId,
            punchId: punch.id,
            evidenceId: evidence.id,
            reviewId: undefined,
          },
        });
      }

      await this.evaluateSessionGrouping(
        tx,
        punch,
        companyId,
        employeeId,
        today,
      );

      await this.eventPublisher.publish(tx, {
        eventType: DomainEventTypes.ATTENDANCE_PUNCH_RECORDED,
        entityId: punch.id,
        entityType: 'AttendancePunch',
        companyId,
        payload: {
          companyId,
          employeeId,
          punchId: punch.id,
        },
      });

      return punch;
    });

    this.pushToCompany(companyId, {
      event: 'punch',
      employeeId,
      punch: result,
    });

    return result;
  }

  private async evaluateSessionGrouping(
    tx: Prisma.TransactionClient,
    punch: { id: string; punchType: PunchType; timestamp: Date },
    companyId: string,
    employeeId: string,
    today: Date,
  ) {
    let aggregate = await tx.attendanceDayAggregate.findUnique({
      where: {
        companyId_employeeId_date: { companyId, employeeId, date: today },
      },
    });

    if (!aggregate) {
      aggregate = await tx.attendanceDayAggregate.create({
        data: {
          companyId,
          employeeId,
          date: today,
          status: 'UNDER_REVIEW',
        },
      });
      await this.historyService.record({
        tx,
        companyId,
        targetType: 'AttendanceDayAggregate',
        targetId: aggregate.id,
        actorId: employeeId,
        transitionType: 'CREATED',
        newState: 'UNDER_REVIEW',
      });
    }

    if (punch.punchType === 'IN') {
      const shiftSnapshot = await this.createShiftSnapshot(
        tx,
        companyId,
        employeeId,
      );

      const session = await tx.attendanceSession.create({
        data: {
          companyId,
          employeeId,
          dayAggregateId: aggregate.id,
          shiftAssignmentSnapshotId: shiftSnapshot?.id ?? undefined,
          sessionStart: punch.timestamp,
          firstPunchId: punch.id,
          sessionStatus: 'ACTIVE',
        },
      });

      await this.historyService.record({
        tx,
        companyId,
        targetType: 'AttendanceSession',
        targetId: session.id,
        actorId: employeeId,
        transitionType: 'SESSION_OPENED',
        newState: 'ACTIVE',
      });

      if (!aggregate.firstPunchAt) {
        await tx.attendanceDayAggregate.update({
          where: { id: aggregate.id },
          data: { firstPunchAt: punch.timestamp },
        });
      }
    } else if (punch.punchType === 'BREAK_START') {
      const activeSession = await tx.attendanceSession.findFirst({
        where: { dayAggregateId: aggregate.id, sessionStatus: 'ACTIVE' },
        orderBy: { sessionStart: 'desc' },
      });

      if (!activeSession) {
        await this.createAnomaly(
          tx,
          companyId,
          employeeId,
          aggregate.id,
          'MISSING_CHECKOUT',
          'BREAK_START received with no active session',
        );
        return;
      }

      await tx.attendanceSession.update({
        where: { id: activeSession.id },
        data: { lastPunchId: punch.id },
      });
    } else if (punch.punchType === 'BREAK_END') {
      const activeSession = await tx.attendanceSession.findFirst({
        where: { dayAggregateId: aggregate.id, sessionStatus: 'ACTIVE' },
        orderBy: { sessionStart: 'desc' },
      });

      if (!activeSession?.lastPunchId) {
        await this.createAnomaly(
          tx,
          companyId,
          employeeId,
          aggregate.id,
          'MISSING_CHECKOUT',
          'BREAK_END received without a matching BREAK_START',
        );
        return;
      }

      const breakStartPunch = await tx.attendancePunch.findUnique({
        where: { id: activeSession.lastPunchId },
      });
      if (!breakStartPunch || breakStartPunch.punchType !== 'BREAK_START') {
        await this.createAnomaly(
          tx,
          companyId,
          employeeId,
          aggregate.id,
          'MISSING_CHECKOUT',
          'BREAK_END received without a matching BREAK_START',
        );
        return;
      }

      const breakMinutes = Math.max(
        0,
        Math.floor(
          (punch.timestamp.getTime() - breakStartPunch.timestamp.getTime()) /
            60000,
        ),
      );

      await tx.attendanceSession.update({
        where: { id: activeSession.id },
        data: {
          totalBreakMinutes:
            (activeSession.totalBreakMinutes || 0) + breakMinutes,
          lastPunchId: punch.id,
        },
      });
    } else if (punch.punchType === 'OUT') {
      const activeSession = await tx.attendanceSession.findFirst({
        where: { dayAggregateId: aggregate.id, sessionStatus: 'ACTIVE' },
        orderBy: { sessionStart: 'desc' },
      });

      if (activeSession) {
        const elapsedMinutes = Math.floor(
          (punch.timestamp.getTime() - activeSession.sessionStart.getTime()) /
            60000,
        );
        const totalWorkedMinutes = Math.max(
          0,
          elapsedMinutes - (activeSession.totalBreakMinutes || 0),
        );

        await tx.attendanceSession.update({
          where: { id: activeSession.id },
          data: {
            sessionEnd: punch.timestamp,
            lastPunchId: punch.id,
            sessionStatus: 'CLOSED',
            totalWorkedMinutes,
          },
        });

        await this.historyService.record({
          tx,
          companyId,
          targetType: 'AttendanceSession',
          targetId: activeSession.id,
          actorId: employeeId,
          transitionType: 'SESSION_CLOSED',
          previousState: 'ACTIVE',
          newState: 'CLOSED',
        });

        const allClosedSessions = await tx.attendanceSession.findMany({
          where: { dayAggregateId: aggregate.id, sessionStatus: 'CLOSED' },
        });
        const totalWork = allClosedSessions.reduce(
          (acc, s) => acc + (s.totalWorkedMinutes || 0),
          0,
        );
        const totalBreaks = allClosedSessions.reduce(
          (acc, s) => acc + (s.totalBreakMinutes || 0),
          0,
        );

        const remainingActive = await tx.attendanceSession.count({
          where: { dayAggregateId: aggregate.id, sessionStatus: 'ACTIVE' },
        });

        const newStatus = remainingActive === 0 ? 'COMPLETED' : 'UNDER_REVIEW';
        await tx.attendanceDayAggregate.update({
          where: { id: aggregate.id },
          data: {
            lastPunchAt: punch.timestamp,
            totalWorkMinutes: totalWork,
            totalBreakMinutes: totalBreaks,
            status: newStatus,
          },
        });

        if (newStatus === 'COMPLETED') {
          await this.historyService.record({
            tx,
            companyId,
            targetType: 'AttendanceDayAggregate',
            targetId: aggregate.id,
            actorId: employeeId,
            transitionType: 'DAY_COMPLETED',
            previousState: 'UNDER_REVIEW',
            newState: 'COMPLETED',
          });
        }

        await this.eventPublisher.publish(tx, {
          eventType: DomainEventTypes.ATTENDANCE_SESSION_CLOSED,
          entityId: activeSession.id,
          entityType: 'AttendanceSession',
          companyId,
          payload: {
            companyId,
            employeeId,
            sessionId: activeSession.id,
          },
        });
      } else {
        await this.createAnomaly(
          tx,
          companyId,
          employeeId,
          aggregate.id,
          'MISSING_CHECKOUT',
          'Punch OUT received with no active session',
        );
      }
    }
  }

  private async createShiftSnapshot(
    tx: Prisma.TransactionClient,
    companyId: string,
    employeeId: string,
  ) {
    const assignment = await tx.employeeShiftAssignment.findFirst({
      where: { companyId, employeeId },
      orderBy: { assignedAt: 'desc' },
      include: { shiftDefinitions: true },
    });

    const shift =
      assignment?.shiftDefinitions ??
      (await tx.shiftDefinition.findFirst({
        where: { companyId, isActive: true },
        orderBy: { createdAt: 'asc' },
      }));

    if (!shift) {
      return null;
    }

    return tx.shiftAssignmentSnapshot.create({
      data: {
        companyId,
        employeeId,
        shiftDefinitionId: shift.id,
        shiftName: shift.name,
        startTime: shift.startTime,
        endTime: shift.endTime,
        gracePeriodMinutes: shift.gracePeriodMinutes,
      },
    });
  }

  private async createAnomaly(
    tx: Prisma.TransactionClient,
    companyId: string,
    employeeId: string,
    aggregateId: string,
    anomalyType: 'MISSING_CHECKOUT',
    remarks: string,
  ) {
    const anomaly = await tx.attendanceAnomaly.create({
      data: {
        companyId,
        employeeId,
        attendanceDayAggregateId: aggregateId,
        anomalyType,
        severity: 'HIGH',
        detectedBy: 'SYSTEM',
        remarks,
      },
    });

    await this.historyService.record({
      tx,
      companyId,
      targetType: 'AttendanceAnomaly',
      targetId: anomaly.id,
      actorId: employeeId,
      transitionType: 'ANOMALY_DETECTED',
      newState: anomalyType,
      reason: remarks,
    });
  }

  async findAll(companyId: string, query: QueryAttendanceDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.AttendanceDayAggregateWhereInput = { companyId };

    if (query.employeeId) {
      where.employeeId = query.employeeId;
    }

    if (query.status) {
      where.status = query.status as any;
    }

    if (query.dateFrom || query.dateTo) {
      where.date = {};
      if (query.dateFrom) where.date.gte = new Date(query.dateFrom);
      if (query.dateTo) where.date.lte = new Date(query.dateTo);
    }

    const allowedSortColumns = ['date', 'status', 'createdAt'] as const;
    const sortBy = allowedSortColumns.includes(query.sortBy as any)
      ? query.sortBy!
      : 'date';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const [total, records] = await Promise.all([
      this.prisma.attendanceDayAggregate.count({ where }),
      this.prisma.attendanceDayAggregate.findMany({
        where,
        include: { employees: true },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
    ]);

    return { data: records, total, page, limit };
  }

  async getTodayStats(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { settings: true },
    });
    const tz = getCompanyTz(
      company?.settings as Record<string, unknown> | null,
    );
    const today = getTodayInTz(tz);

    const total = await this.employeesService.countActive(companyId);

    const records = await this.prisma.attendanceDayAggregate.findMany({
      where: { companyId, date: today },
    });

    let present = 0;
    for (const r of records) {
      if (r.status === 'UNDER_REVIEW' || r.status === 'COMPLETED') present++;
    }

    const todayDate = new Date(today);
    const approvedLeaves = await this.leaveRequestsService.countApprovedLeaves(
      companyId,
      todayDate,
    );

    const onLeave = approvedLeaves;
    const absent = Math.max(0, total - present - onLeave);

    return { present, absent, onLeave, total };
  }

  async getLast7Days(companyId: string) {
    const days: Array<{
      date: string;
      present: number;
      absent: number;
      onLeave: number;
    }> = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dateStart = new Date(dateStr);

      const records = await this.prisma.attendanceDayAggregate.findMany({
        where: { companyId, date: dateStart },
      });

      let present = 0;
      for (const r of records) {
        if (r.status === 'UNDER_REVIEW' || r.status === 'COMPLETED') present++;
      }

      const approvedLeaves =
        await this.leaveRequestsService.countApprovedLeaves(
          companyId,
          dateStart,
        );

      const totalEmployees = await this.employeesService.countActive(companyId);

      const onLeave = approvedLeaves;
      const absent = Math.max(0, totalEmployees - present - onLeave);

      days.push({ date: dateStr, present, absent, onLeave });
    }

    const employees = await this.employeesService.findActiveBasic(companyId);

    return { days, employees };
  }

  async findOne(companyId: string, id: string) {
    return this.prisma.attendanceDayAggregate.findFirst({
      where: { id, companyId },
      include: {
        employees: true,
        attendanceSessions: true,
        attendanceAnomalies: true,
      },
    });
  }

  async createManual(companyId: string, dto: CreateAttendanceDto) {
    const existing = await this.prisma.attendanceDayAggregate.findFirst({
      where: {
        companyId,
        employeeId: dto.employeeId,
        date: new Date(dto.date),
      },
    });
    if (existing) {
      throw new BadRequestException(
        'Attendance record already exists for this date',
      );
    }

    const record = await this.prisma.attendanceDayAggregate.create({
      data: {
        companyId,
        employeeId: dto.employeeId,
        date: new Date(dto.date),
        status: dto.status as any,
      },
    });

    if (dto.checkIn) {
      let checkInDate: Date;
      if (dto.checkIn.includes('T')) {
        checkInDate = new Date(dto.checkIn);
      } else {
        checkInDate = new Date(dto.date);
        const [hh, mm] = dto.checkIn.split(':').map(Number);
        checkInDate.setHours(hh, mm, 0, 0);
      }

      const inPunch = await this.prisma.attendancePunch.create({
        data: {
          companyId,
          employeeId: dto.employeeId,
          punchType: 'IN',
          timestamp: checkInDate,
        },
      });

      const shiftSnapshot = await this.createShiftSnapshot(
        this.prisma,
        companyId,
        dto.employeeId,
      );

      let totalWorkedMinutes = 0;
      let sessionStatus: 'ACTIVE' | 'CLOSED' = 'ACTIVE';
      let sessionEnd: Date | undefined;

      if (dto.checkOut) {
        let checkOutDate: Date;
        if (dto.checkOut.includes('T')) {
          checkOutDate = new Date(dto.checkOut);
        } else {
          checkOutDate = new Date(dto.date);
          const [oh, om] = dto.checkOut.split(':').map(Number);
          checkOutDate.setHours(oh, om, 0, 0);
        }
        sessionEnd = checkOutDate;
        sessionStatus = 'CLOSED';
        totalWorkedMinutes = Math.max(
          0,
          Math.floor((checkOutDate.getTime() - checkInDate.getTime()) / 60000),
        );

        const outPunch = await this.prisma.attendancePunch.create({
          data: {
            companyId,
            employeeId: dto.employeeId,
            punchType: 'OUT',
            timestamp: checkOutDate,
          },
        });

        await this.prisma.attendanceSession.create({
          data: {
            companyId,
            employeeId: dto.employeeId,
            dayAggregateId: record.id,
            sessionStart: checkInDate,
            sessionEnd: checkOutDate,
            firstPunchId: inPunch.id,
            lastPunchId: outPunch.id,
            sessionStatus,
            totalWorkedMinutes,
            shiftAssignmentSnapshotId: shiftSnapshot?.id ?? undefined,
          },
        });

        await this.prisma.attendanceDayAggregate.update({
          where: { id: record.id },
          data: {
            firstPunchAt: checkInDate,
            lastPunchAt: checkOutDate,
            totalWorkMinutes: totalWorkedMinutes,
          },
        });
      } else {
        await this.prisma.attendanceSession.create({
          data: {
            companyId,
            employeeId: dto.employeeId,
            dayAggregateId: record.id,
            sessionStart: checkInDate,
            firstPunchId: inPunch.id,
            sessionStatus,
            shiftAssignmentSnapshotId: shiftSnapshot?.id ?? undefined,
          },
        });

        await this.prisma.attendanceDayAggregate.update({
          where: { id: record.id },
          data: { firstPunchAt: checkInDate },
        });
      }
    }

    return record;
  }

  async update(companyId: string, id: string, dto: UpdateAttendanceDto) {
    const record = await this.prisma.attendanceDayAggregate.findFirst({
      where: { id, companyId },
    });
    if (!record) {
      throw new BadRequestException('Attendance record not found');
    }
    if (dto.status) {
      this.transitionService.validate(
        'DayAggregate',
        record.status as string,
        dto.status as string,
      );
    }
    return this.prisma.attendanceDayAggregate.update({
      where: { id },
      data: { status: dto.status as any },
    });
  }

  async remove(companyId: string, id: string) {
    const record = await this.prisma.attendanceDayAggregate.findFirst({
      where: { id, companyId },
    });
    if (!record) {
      throw new BadRequestException('Attendance record not found');
    }
    return this.prisma.attendanceDayAggregate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async verify(companyId: string, id: string) {
    const record = await this.prisma.attendanceDayAggregate.findFirst({
      where: { id, companyId },
    });
    if (!record) {
      throw new BadRequestException('Attendance record not found');
    }
    this.transitionService.validate(
      'DayAggregate',
      record.status as string,
      'COMPLETED',
    );
    return this.prisma.attendanceDayAggregate.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });
  }
}
