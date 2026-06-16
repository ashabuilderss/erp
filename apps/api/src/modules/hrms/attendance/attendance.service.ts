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
import { Prisma } from '@prisma/client';
import { safeSortBy } from '../../../common/utils/sort-by';

const ALLOWED_SORT = [
  'createdAt',
  'updatedAt',
  'date',
  'status',
  'checkIn',
  'checkOut',
] as const;

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

  async getMyAttendance(employeeId: string, companyId: string) {
    return this.prisma.attendance.findMany({
      where: { employeeId, companyId },
      orderBy: { date: 'desc' },
      take: 60,
    });
  }

  async checkIn(employeeId: string, companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.attendance.findUnique({
      where: {
        employeeId_date: { employeeId, date: today },
      },
    });

    if (existing) {
      if (existing.checkIn) {
        throw new BadRequestException('Already checked in today');
      }
      const record = await this.prisma.attendance.update({
        where: { id: existing.id },
        data: { checkIn: new Date(), status: 'PRESENT' },
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
        checkIn: new Date(),
        status: 'PRESENT',
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

  async checkOut(employeeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.attendance.findUnique({
      where: {
        employeeId_date: { employeeId, date: today },
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

    const record = await this.prisma.attendance.update({
      where: { id: existing.id },
      data: { checkOut: new Date() },
    });
    this.eventEmitter.emit(AttendanceEvents.CheckOut, {
      companyId: record.companyId,
      employeeId,
      record,
    });
    this.pushToCompany(record.companyId, {
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

    const existing = await this.prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: dto.employeeId,
          date: new Date(dto.date),
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
        date: new Date(dto.date),
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
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
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
    if (dto.date !== undefined) data.date = new Date(dto.date);
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

  async getTodayAttendance(companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
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
      this.prisma.attendance.count({
        where: {
          date: { gte: today, lt: tomorrow },
          status: 'LEAVE',
          companyId,
        },
      }),
      this.prisma.employee.count({ where: { status: 'ACTIVE', companyId } }),
    ]);

    return { present, absent, onLeave, total, late: 0 };
  }
}
