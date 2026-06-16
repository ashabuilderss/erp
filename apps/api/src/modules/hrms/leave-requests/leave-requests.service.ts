import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../config/prisma.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { ApproveLeaveRequestDto } from './dto/approve-leave-request.dto';
import { QueryLeaveRequestDto } from './dto/query-leave-request.dto';
import { Prisma, LeaveStatus } from '@prisma/client';
import { safeSortBy } from '../../../common/utils/sort-by';
import { NotificationEvents } from '../../notifications/events/notification-events';

const ALLOWED_SORT = [
  'createdAt',
  'updatedAt',
  'startDate',
  'endDate',
  'status',
  'type',
] as const;

@Injectable()
export class LeaveRequestsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async createMyLeaveRequest(
    dto: CreateLeaveRequestDto,
    employeeId: string,
    companyId: string,
  ) {
    return this.create(dto, companyId, employeeId);
  }

  async create(
    dto: CreateLeaveRequestDto,
    companyId: string,
    employeeIdOverride?: string,
  ) {
    const resolvedEmployeeId = employeeIdOverride ?? dto.employeeId;
    const employee = await this.prisma.employee.findUnique({
      where: { id: resolvedEmployeeId },
    });
    if (!employee)
      throw new BadRequestException(
        `Employee with ID ${resolvedEmployeeId} not found`,
      );

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (start > end)
      throw new BadRequestException(
        'Start date must be before or equal to end date',
      );

    const leave = await this.prisma.leaveRequest.create({
      data: {
        ...dto,
        companyId,
        startDate: start,
        endDate: end,
        employeeId: resolvedEmployeeId,
      },
      include: { employee: { include: { user: true } } },
    });

    const employeeUser = leave.employee?.user;
    if (employeeUser) {
      this.eventEmitter.emit(NotificationEvents.LeaveRequested, {
        userId: employeeUser.id,
        companyId,
        title: 'Leave Request Submitted',
        message: `Your ${leave.type.toLowerCase()} leave (${dto.startDate} - ${dto.endDate}) has been submitted`,
        type: 'LEAVE_REQUESTED',
        link: `/leave-requests/${leave.id}`,
      });
    }

    return leave;
  }

  async findAll(
    query: QueryLeaveRequestDto,
    companyId: string,
    employeeIdOverride?: string,
  ) {
    const {
      page = 1,
      limit = 10,
      employeeId,
      status,
      type,
      startDateFrom,
      endDateTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.LeaveRequestWhereInput = { companyId };

    if (employeeIdOverride) {
      where.employeeId = employeeIdOverride;
    } else if (employeeId) {
      where.employeeId = employeeId;
    }
    if (status) where.status = status;
    if (type) where.type = type;
    if (startDateFrom || endDateTo) {
      where.startDate = {};
      if (startDateFrom) where.startDate.gte = new Date(startDateFrom);
      if (endDateTo) where.startDate.lte = new Date(endDateTo);
    }
    if (search) {
      where.OR = [
        { reason: { contains: search, mode: 'insensitive' } },
        {
          employee: { employeeCode: { contains: search, mode: 'insensitive' } },
        },
        {
          employee: {
            user: { firstName: { contains: search, mode: 'insensitive' } },
          },
        },
        {
          employee: {
            user: { lastName: { contains: search, mode: 'insensitive' } },
          },
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.leaveRequest.findMany({
        where,
        orderBy: { [safeSortBy(sortBy, ALLOWED_SORT, 'createdAt')]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          employee: { include: { user: true, department: true } },
          approvedBy: { include: { user: true } },
        },
      }),
      this.prisma.leaveRequest.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, companyId: string, employeeIdOverride?: string) {
    const where: Prisma.LeaveRequestWhereInput = { id, companyId };
    if (employeeIdOverride) where.employeeId = employeeIdOverride;

    const leave = await this.prisma.leaveRequest.findFirst({
      where,
      include: {
        employee: { include: { user: true, department: true } },
        approvedBy: { include: { user: true } },
      },
    });
    if (!leave)
      throw new NotFoundException(`Leave request with ID ${id} not found`);
    return leave;
  }

  async update(
    id: string,
    dto: UpdateLeaveRequestDto,
    companyId: string,
    employeeIdOverride?: string,
  ) {
    await this.findOne(id, companyId, employeeIdOverride);

    const data: Prisma.LeaveRequestUpdateInput = { ...dto };
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);

    if (dto.startDate && dto.endDate) {
      if (new Date(dto.startDate) > new Date(dto.endDate)) {
        throw new BadRequestException(
          'Start date must be before or equal to end date',
        );
      }
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data,
      include: { employee: { include: { user: true } } },
    });
  }

  async approve(
    id: string,
    dto: ApproveLeaveRequestDto,
    userId: string,
    companyId: string,
  ) {
    const leave = await this.findOne(id, companyId);

    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(
        `Leave request is already ${leave.status.toLowerCase()}`,
      );
    }

    const employee = await this.prisma.employee.findUnique({
      where: { userId },
    });

    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: dto.status,
        approvedById: employee?.id ?? null,
        approvedAt: new Date(),
      },
      include: {
        employee: { include: { user: true } },
        approvedBy: { include: { user: true } },
      },
    });

    const employeeUser = updated.employee?.user;
    if (employeeUser) {
      const isApproved = dto.status === LeaveStatus.APPROVED;
      const eventName = isApproved
        ? NotificationEvents.LeaveApproved
        : NotificationEvents.LeaveRejected;
      this.eventEmitter.emit(eventName, {
        userId: employeeUser.id,
        companyId,
        title: isApproved ? 'Leave Approved' : 'Leave Rejected',
        message: `Your ${updated.type.toLowerCase()} leave request has been ${isApproved ? 'approved' : 'rejected'}`,
        type: isApproved ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
        link: `/leave-requests/${id}`,
      });
    }

    return updated;
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.leaveRequest.delete({ where: { id } });
  }

  async getPendingCount(companyId: string) {
    return this.prisma.leaveRequest.count({
      where: { status: LeaveStatus.PENDING, companyId },
    });
  }
}
