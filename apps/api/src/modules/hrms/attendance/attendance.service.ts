import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Subject } from 'rxjs';
import { PrismaService } from '../../../config/prisma.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { AttendanceEvents } from './events/attendance-events';
import { Prisma, EmployeeStaffType } from '@prisma/client';
import { safeSortBy } from '../../../common/utils/sort-by';
import {
  getCompanyTz,
  getTodayInTz,
  getNowInTz,
  getTimeInTz,
  getDateStringInTz,
} from '../../../common/utils/company-time';

const ALLOWED_SORT = [
  'createdAt',
  'updatedAt',
  'date',
  'status',
  'checkIn',
  'checkOut',
] as const;

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
  private sseSubjects = new Map<string, Subject<unknown>>();

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  subscribe(companyId: string): Subject<unknown> {
    if (!this.sseSubjects.has(companyId)) {
      this.sseSubjects.set(companyId, new Subject<unknown>());
    }
    return this.sseSubjects.get(companyId)!;
  }

  private pushToCompany(companyId: string, data: unknown) {
    if (this.sseSubjects.has(companyId)) {
      this.sseSubjects.get(companyId)!.next(data);
    }
  }

  private async loadEmployeeWithSettings(employeeId: string, companyId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { company: { select: { settings: true } } },
    });
    if (!employee) throw new BadRequestException('Employee not found');
    return employee;
  }

  private parseSettings(settings: unknown) {
    const s = (settings as Record<string, unknown>) ?? {};
    return {
      officeLat: s.officeLatitude as number | undefined,
      officeLng: s.officeLongitude as number | undefined,
      geofenceRadius: (s.geofenceRadiusMeters as number) ?? 200,
      officeIpRanges: (s.officeIpRanges as string[]) ?? [],
      officeStartHour: (s.officeStartHour as number) ?? 10,
      officeStartMinute: (s.officeStartMinute as number) ?? 0,
      lateThresholdMinutes: (s.lateThresholdMinutes as number) ?? 15,
      tz: getCompanyTz(s as Record<string, unknown>),
    };
  }

  async getMyAttendance(employeeId: string, companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { settings: true },
    });
    const tz = getCompanyTz(company?.settings as Record<string, unknown> | null);
    const records = await this.prisma.attendance.findMany({
      where: { employeeId, companyId },
      orderBy: { date: 'desc' },
      take: 60,
    });
    return {
      today: getDateStringInTz(tz),
      records,
    };
  }

  async checkIn(
    employeeId: string,
    companyId: string,
    options?: {
      latitude?: number;
      longitude?: number;
      checkInPhoto?: string;
      ipAddress?: string;
    },
  ) {
    const employee = await this.loadEmployeeWithSettings(employeeId, companyId);
    const settings = this.parseSettings(employee.company.settings);
    const staffType = employee.staffType ?? EmployeeStaffType.OFFICE;
    const today = getTodayInTz(settings.tz);

    if (staffType === EmployeeStaffType.FIELD) {
      if (!options?.checkInPhoto) {
        throw new BadRequestException('Field employees must upload a check-in photo');
      }
      if (!options?.latitude || !options?.longitude) {
        throw new BadRequestException('Field employees must provide GPS location');
      }
      if (settings.officeLat && settings.officeLng) {
        const dist = haversineDistance(
          options.latitude,
          options.longitude,
          settings.officeLat,
          settings.officeLng,
        );
        if (dist > settings.geofenceRadius) {
          throw new BadRequestException(
            `You are ${Math.round(dist)}m from the office (max ${settings.geofenceRadius}m). Move closer to check in.`,
          );
        }
      }
    }

    if (staffType === EmployeeStaffType.HYBRID) {
      const hasLocation = !!(options?.latitude && options?.longitude);
      const hasPhoto = !!options?.checkInPhoto;
      if (!hasLocation && !hasPhoto) {
        throw new BadRequestException(
          'Hybrid employees must provide either GPS location or a check-in photo',
        );
      }
      if (hasLocation && settings.officeLat && settings.officeLng) {
        const dist = haversineDistance(
          options.latitude!,
          options.longitude!,
          settings.officeLat,
          settings.officeLng,
        );
        if (dist > settings.geofenceRadius) {
          throw new BadRequestException(
            `You are ${Math.round(dist)}m from the office (max ${settings.geofenceRadius}m). Move closer to check in.`,
          );
        }
      }
    }

    if (staffType === EmployeeStaffType.OFFICE && options?.ipAddress && settings.officeIpRanges.length > 0) {
      const allowed = settings.officeIpRanges.some((range) => {
        if (range.endsWith('.0/24')) {
          const prefix = range.slice(0, -7);
          return options.ipAddress!.startsWith(prefix);
        }
        return options.ipAddress === range;
      });
      if (!allowed) {
        throw new BadRequestException(
          'Office employees must check in from an approved office network',
        );
      }
    }

    const now = getNowInTz(settings.tz);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = settings.officeStartHour * 60 + settings.officeStartMinute;
    const isLate = nowMinutes > startMinutes + settings.lateThresholdMinutes;

    const existing = await this.prisma.attendance.findUnique({
      where: {
        companyId_employeeId_date: { companyId, employeeId, date: today },
      },
    });

    if (existing) {
      if (existing.checkIn) {
        throw new BadRequestException('Already checked in today');
      }
      const record = await this.prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkIn: now,
          status: isLate ? 'HALF_DAY' : 'PRESENT',
          ...(options?.latitude !== undefined && { latitude: options.latitude }),
          ...(options?.longitude !== undefined && { longitude: options.longitude }),
          ...(options?.checkInPhoto !== undefined && { checkInPhoto: options.checkInPhoto }),
        },
      });
      this.eventEmitter.emit(AttendanceEvents.CheckIn, {
        companyId,
        employeeId,
        record,
      });
      this.pushToCompany(companyId, { event: 'check-in', employeeId, record });
      return record;
    }

    const record = await this.prisma.attendance.create({
      data: {
        employeeId,
        companyId,
        date: today,
        checkIn: now,
        status: isLate ? 'HALF_DAY' : 'PRESENT',
        ...(options?.latitude !== undefined && { latitude: options.latitude }),
        ...(options?.longitude !== undefined && { longitude: options.longitude }),
        ...(options?.checkInPhoto !== undefined && { checkInPhoto: options.checkInPhoto }),
      },
    });
    this.eventEmitter.emit(AttendanceEvents.CheckIn, {
      companyId,
      employeeId,
      record,
    });
    this.pushToCompany(companyId, { event: 'check-in', employeeId, record });
    return record;
  }

  async checkOut(
    employeeId: string,
    companyId: string,
    options?: {
      latitude?: number;
      longitude?: number;
      checkOutPhoto?: string;
    },
  ) {
    const employee = await this.loadEmployeeWithSettings(employeeId, companyId);
    const settings = this.parseSettings(employee.company.settings);
    const staffType = employee.staffType ?? EmployeeStaffType.OFFICE;
    const today = getTodayInTz(settings.tz);

    const existing = await this.prisma.attendance.findUnique({
      where: {
        companyId_employeeId_date: { companyId, employeeId, date: today },
      },
    });

    if (!existing) {
      throw new BadRequestException('Not checked in today');
    }
    if (!existing.checkIn) {
      throw new BadRequestException('Must check in before checking out');
    }
    if (existing.checkOut) {
      throw new BadRequestException('Already checked out today');
    }

    if (staffType === EmployeeStaffType.FIELD && !options?.checkOutPhoto) {
      throw new BadRequestException('Field employees must upload a check-out photo');
    }
    if (staffType === EmployeeStaffType.HYBRID && !options?.checkOutPhoto) {
      throw new BadRequestException('Hybrid employees must upload a check-out photo');
    }

    const record = await this.prisma.attendance.update({
      where: { id: existing.id },
      data: {
        checkOut: getNowInTz(settings.tz),
        ...(options?.latitude !== undefined && { latitude: options.latitude }),
        ...(options?.longitude !== undefined && { longitude: options.longitude }),
        ...(options?.checkOutPhoto !== undefined && { checkOutPhoto: options.checkOutPhoto }),
      },
    });
    this.eventEmitter.emit(AttendanceEvents.CheckOut, {
      companyId,
      employeeId,
      record,
    });
    this.pushToCompany(companyId, {
      event: 'check-out',
      employeeId,
      record,
    });
    return record;
  }

  async create(dto: CreateAttendanceDto, companyId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
    });
    if (!employee)
      throw new BadRequestException(
        `Employee with ID ${dto.employeeId} not found`,
      );

    const date = new Date(dto.date + 'T00:00:00.000Z');
    const existing = await this.prisma.attendance.findUnique({
      where: {
        companyId_employeeId_date: {
          companyId,
          employeeId: dto.employeeId,
          date,
        },
      },
    });
    if (existing)
      throw new BadRequestException(
        `Attendance for employee ${dto.employeeId} on ${dto.date} already exists`,
      );

    return this.prisma.attendance.create({
      data: {
        employeeId: dto.employeeId,
        companyId,
        date,
        checkIn: dto.checkIn ? new Date(dto.checkIn) : null,
        checkOut: dto.checkOut ? new Date(dto.checkOut) : null,
        status: dto.status,
      },
      include: { employee: { include: { user: true } } },
    });
  }

  async findAll(query: QueryAttendanceDto, companyId: string) {
    const {
      page = 1,
      limit = 10,
      employeeId,
      status,
      dateFrom,
      dateTo,
      search,
      sortBy = 'date',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.AttendanceWhereInput = { companyId };

    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom + 'T00:00:00.000Z');
      if (dateTo) where.date.lte = new Date(dateTo + 'T23:59:59.999Z');
    }
    if (search) {
      where.employee = {
        OR: [
          { employeeCode: { contains: search, mode: 'insensitive' } },
          { user: { firstName: { contains: search, mode: 'insensitive' } } },
          { user: { lastName: { contains: search, mode: 'insensitive' } } },
        ],
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        orderBy: { [safeSortBy(sortBy, ALLOWED_SORT, 'date')]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          employee: {
            include: { user: true, department: true, designation: true },
          },
        },
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, companyId: string) {
    const attendance = await this.prisma.attendance.findFirst({
      where: { id, companyId },
      include: {
        employee: {
          include: { user: true, department: true, designation: true },
        },
      },
    });
    if (!attendance)
      throw new NotFoundException(`Attendance with ID ${id} not found`);
    return attendance;
  }

  async update(id: string, dto: UpdateAttendanceDto, companyId: string) {
    await this.findOne(id, companyId);

    const data: Prisma.AttendanceUpdateInput = { ...dto };
    if (dto.date !== undefined) data.date = new Date(dto.date + 'T00:00:00.000Z');
    if (dto.checkIn !== undefined)
      data.checkIn = dto.checkIn ? new Date(dto.checkIn) : null;
    if (dto.checkOut !== undefined)
      data.checkOut = dto.checkOut ? new Date(dto.checkOut) : null;

    return this.prisma.attendance.update({
      where: { id },
      data,
      include: { employee: { include: { user: true } } },
    });
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.attendance.delete({ where: { id } });
  }

  async verify(id: string, verifiedByEmployeeId: string, companyId: string) {
    const record = await this.findOne(id, companyId);
    if (record.verified) {
      throw new BadRequestException('Attendance already verified');
    }
    return this.prisma.attendance.update({
      where: { id },
      data: {
        verified: true,
        verifiedById: verifiedByEmployeeId,
        verifiedAt: new Date(),
      },
      include: {
        employee: { include: { user: true } },
        verifiedBy: { include: { user: true } },
      },
    });
  }

  async getLast7Days(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { settings: true },
    });
    const tz = getCompanyTz(company?.settings as Record<string, unknown> | null);

    const today = getTodayInTz(tz);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const records = await this.prisma.attendance.findMany({
      where: {
        companyId,
        date: { gte: sevenDaysAgo, lte: today },
      },
      include: {
        employee: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: [{ employee: { employeeCode: 'asc' } }, { date: 'asc' }],
    });

    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      days.push(d.toISOString().slice(0, 10));
    }

    const grouped: Record<
      string,
      {
        employee: (typeof records)[0]['employee'];
        days: Record<string, string | null>;
      }
    > = {};
    for (const r of records) {
      const key = r.employee.id;
      if (!grouped[key]) {
        grouped[key] = { employee: r.employee, days: {} };
        for (const day of days) grouped[key].days[day] = null;
      }
      const dateKey =
        r.date instanceof Date
          ? r.date.toISOString().slice(0, 10)
          : String(r.date).slice(0, 10);
      grouped[key].days[dateKey] =
        r.checkIn && r.checkOut ? 'PRESENT' : r.checkIn ? 'PARTIAL' : r.status;
    }

    return {
      days,
      employees: Object.values(grouped),
    };
  }

  async getTodayAttendance(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { settings: true },
    });
    const tz = getCompanyTz(company?.settings as Record<string, unknown> | null);

    const today = getTodayInTz(tz);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [present, absent, onLeave, total] = await Promise.all([
      this.prisma.attendance.count({
        where: {
          date: { gte: today, lt: tomorrow },
          status: 'PRESENT',
          companyId,
        },
      }),
      this.prisma.attendance.count({
        where: {
          date: { gte: today, lt: tomorrow },
          status: 'ABSENT',
          companyId,
        },
      }),
      this.prisma.leaveRequest.count({
        where: {
          startDate: { lte: today },
          endDate: { gte: today },
          status: 'APPROVED',
          companyId,
        },
      }),
      this.prisma.employee.count({ where: { status: 'ACTIVE', companyId } }),
    ]);

    const late = await this.prisma.attendance.count({
      where: {
        date: { gte: today, lt: tomorrow },
        status: 'HALF_DAY',
        companyId,
      },
    });
    return { present, absent, onLeave, total, late };
  }
}
