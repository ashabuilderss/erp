import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import { CreateAttendanceCorrectionDto } from './dto/create-attendance-correction.dto';
import { QueryAttendanceCorrectionDto } from './dto/query-attendance-correction.dto';
import { ApprovalsSpawningService, ApprovalsRuntimeService } from '../../approvals';
import { AttendanceFinalizationService } from '../attendance/attendance-finalization.service';
import { EmployeesService } from '../employees/employees.service';
import { GovernanceEventPublisher } from '../../governance-events/governance-event.publisher';
import { DomainEventTypes } from '../../governance-events/types/events';
import { AttendanceHistoryService } from '../attendance/attendance-history.service';

@Injectable()
export class AttendanceCorrectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly approvalsSpawning: ApprovalsSpawningService,
    private readonly approvalsRuntime: ApprovalsRuntimeService,
    private readonly finalizationService: AttendanceFinalizationService,
    private readonly employeesService: EmployeesService,
    private readonly eventPublisher: GovernanceEventPublisher,
    private readonly historyService: AttendanceHistoryService,
  ) {}

  async create(
    dto: CreateAttendanceCorrectionDto,
    employeeId: string,
    companyId: string,
  ) {
    const correctionDate = new Date(dto.date);
    correctionDate.setUTCHours(0, 0, 0, 0);

    const employee = await this.employeesService.findBasicByIdAndCompany(employeeId, companyId);
    if (!employee?.userId) {
      throw new BadRequestException(
        'Employee user account is required for correction approval',
      );
    }
    const employeeUserId = employee.userId;

    const dayAggregate = await this.prisma.attendanceDayAggregate.findFirst({
      where: { employeeId, companyId, date: correctionDate },
    });

    const result = await this.prisma.$transaction(async (tx) => {
      const correction = await tx.attendanceCorrection.create({
        data: {
          employeeId,
          companyId,
          reason: dto.reason,
          dayAggregateId: dayAggregate?.id,
          requestedCheckIn: dto.requestedCheckIn,
          requestedCheckOut: dto.requestedCheckOut,
          requestedStatus: dto.requestedStatus,
        },
      });

      const approval = await this.approvalsSpawning.spawnRequest(
        companyId,
        'AttendanceCorrection',
        correction.id,
        employeeUserId,
      );

      const updated = await tx.attendanceCorrection.update({
        where: { id: correction.id },
        data: { approvalRequestId: approval.id },
      });

      await this.historyService.record({
        tx,
        companyId,
        targetType: 'AttendanceCorrection',
        targetId: correction.id,
        actorId: employeeId,
        transitionType: 'CORRECTION_REQUESTED',
        newState: 'PENDING',
        reason: dto.reason,
      });

      await this.eventPublisher.publish(tx, {
        eventType: DomainEventTypes.ATTENDANCE_CORRECTION_REQUESTED,
        entityId: correction.id,
        entityType: 'AttendanceCorrection',
        companyId,
        payload: {
          companyId,
          correctionId: correction.id,
          employeeId,
        },
      });

      return updated;
    });

    return result;
  }

  async findAll(query: QueryAttendanceCorrectionDto, companyId: string) {
    const where: any = { companyId };
    if (query.employeeId) where.employeeId = query.employeeId;

    const [data, total] = await Promise.all([
      this.prisma.attendanceCorrection.findMany({
        where,
        skip: ((query.page ?? 1) - 1) * (query.limit ?? 10),
        take: query.limit ?? 10,
        orderBy: { createdAt: 'desc' },
        include: {
          approvalRequests: {
            select: {
              status: true,
              approvalHistories: { select: { comments: true }, orderBy: { createdAt: 'desc' }, take: 1 },
            },
          },
          employees: { include: { users: true } },
        },
      }),
      this.prisma.attendanceCorrection.count({ where }),
    ]);

    let filtered = data.map((c) => ({
      ...c,
      status: c.approvalRequests?.status ?? 'PENDING',
      notes: c.approvalRequests?.approvalHistories?.[0]?.comments ?? null,
      employee: c.employees,
    }));

    if (query.status) {
      filtered = filtered.filter((c) => c.status === query.status);
    }

    return {
      data: filtered,
      meta: {
        total,
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        totalPages: Math.ceil(total / (query.limit ?? 10)),
      },
    };
  }

  async findMyCorrections(employeeId: string) {
    const corrections = await this.prisma.attendanceCorrection.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
      include: {
        approvalRequests: {
          select: {
            status: true,
            approvalHistories: { select: { comments: true }, orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
    });

    return corrections.map((c) => ({
      ...c,
      status: c.approvalRequests?.status ?? 'PENDING',
      notes: c.approvalRequests?.approvalHistories?.[0]?.comments ?? null,
    }));
  }

  async findOne(id: string, companyId: string) {
    const correction = await this.prisma.attendanceCorrection.findFirst({
      where: { id, companyId },
      include: {
        employees: true,
        attendanceDayAggregates: true,
        attendanceEvidence: true,
      },
    });
    if (!correction) {
      throw new NotFoundException('Attendance correction not found');
    }
    return correction;
  }

  async approve(
    id: string,
    approvedById: string,
    companyId: string,
    notes?: string,
  ) {
    const correction = await this.findOne(id, companyId);
    if (!correction.approvalRequestId) {
      throw new BadRequestException(
        'Attendance correction has no approval request',
      );
    }

    await this.approvalsRuntime.approveStep(
      correction.approvalRequestId,
      approvedById,
      notes,
    );

    const approval = await this.prisma.approvalRequest.findFirst({
      where: { id: correction.approvalRequestId, companyId },
    });

    if (approval?.status === 'APPROVED') {
      await this.prisma.$transaction(async (tx) => {
        await this.historyService.record({
          tx,
          companyId,
          targetType: 'AttendanceCorrection',
          targetId: id,
          actorId: approvedById,
          transitionType: 'CORRECTION_APPROVED',
          previousState: 'PENDING',
          newState: 'APPROVED',
        });

        await this.eventPublisher.publish(tx, {
          eventType: DomainEventTypes.ATTENDANCE_CORRECTION_APPROVED,
          entityId: id,
          entityType: 'AttendanceCorrection',
          companyId,
          payload: {
            companyId,
            correctionId: id,
            employeeId: correction.employeeId,
            approvedById,
          },
        });
      });

      if (correction.attendanceDayAggregates) {
        await this.refinalizeCorrectionDay(
          companyId,
          approvedById,
          correction.attendanceDayAggregates.date,
          correction.id,
        );
      }
    }

    return this.findOne(id, companyId);
  }

  async reject(
    id: string,
    approvedById: string,
    companyId: string,
    notes?: string,
  ) {
    const correction = await this.findOne(id, companyId);
    if (!correction.approvalRequestId) {
      throw new BadRequestException(
        'Attendance correction has no approval request',
      );
    }

    await this.approvalsRuntime.rejectStep(
      correction.approvalRequestId,
      approvedById,
      notes,
    );

    await this.prisma.$transaction(async (tx) => {
      await this.historyService.record({
        tx,
        companyId,
        targetType: 'AttendanceCorrection',
        targetId: id,
        actorId: approvedById,
        transitionType: 'CORRECTION_REJECTED',
        previousState: 'PENDING',
        newState: 'REJECTED',
        reason: notes,
      });

      await this.eventPublisher.publish(tx, {
        eventType: DomainEventTypes.ATTENDANCE_CORRECTION_REJECTED,
        entityId: id,
        entityType: 'AttendanceCorrection',
        companyId,
        payload: {
          companyId,
          correctionId: id,
          employeeId: correction.employeeId,
          rejectedById: approvedById,
        },
      });
    });

    return this.findOne(id, companyId);
  }

  private async refinalizeCorrectionDay(
    companyId: string,
    finalizedById: string,
    date: Date,
    correctionId: string,
  ) {
    const period = await this.prisma.attendancePeriod.findFirst({
      where: {
        companyId,
        startDate: { lte: date },
        endDate: { gte: date },
        status: { not: 'PAYROLL_LOCKED' },
      },
    });
    if (!period) return;

    const correction = await this.prisma.attendanceCorrection.findFirst({
      where: { id: correctionId },
    });

    const correctionOverrides = correction?.dayAggregateId
      ? [
          {
            dayAggregateId: correction.dayAggregateId,
            requestedCheckIn: correction.requestedCheckIn ?? undefined,
            requestedCheckOut: correction.requestedCheckOut ?? undefined,
          },
        ]
      : [];

    await this.finalizationService.finalizePeriod({
      companyId,
      attendancePeriodId: period.id,
      finalizedById,
      correctionOverrides,
    });
  }
}
