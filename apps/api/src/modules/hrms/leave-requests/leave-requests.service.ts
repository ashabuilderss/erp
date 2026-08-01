import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../config/prisma.service';
import { TransitionService } from '../../../common/services/transition.service';
import { EmployeesService } from '../employees/employees.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { ApproveLeaveRequestDto } from './dto/approve-leave-request.dto';
import { QueryLeaveRequestDto } from './dto/query-leave-request.dto';
import { Prisma, LeaveStatus, UserRole } from '@prisma/client';
import { safeSortBy } from '../../../common/utils/sort-by';
import { NotificationEvents } from '../../notifications/events/notification-events';
import { GovernanceEventPublisher } from '../../governance-events/governance-event.publisher';
import { DomainEventTypes } from '../../governance-events/types/events';

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
    private transitionService: TransitionService,
    private employeesService: EmployeesService,
    @Optional() private eventPublisher?: GovernanceEventPublisher,
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
    const employee = await this.employeesService.findBasicById(resolvedEmployeeId);
    if (!employee)
      throw new BadRequestException(
        `Employee with ID ${resolvedEmployeeId} not found`,
      );
    if (employee.companyId !== companyId)
      throw new BadRequestException(
        `Employee with ID ${resolvedEmployeeId} does not belong to this company`,
      );

    if (dto.type !== 'MEDICAL') {
      throw new BadRequestException(
        'Only medical emergency leave is supported',
      );
    }

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (start > end)
      throw new BadRequestException(
        'Start date must be before or equal to end date',
      );

    const daysRequested =
      Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (daysRequested > 3) {
      throw new BadRequestException('Leave cannot exceed 3 consecutive days');
    }

    if (!dto.documentUrl) {
      throw new BadRequestException(
        'Medical leave requires a supporting document upload',
      );
    }

    if (!dto.reason) {
      throw new BadRequestException('Medical leave requires a reason');
    }

    const year = start.getFullYear();
    const allocation = await this.prisma.leaveAllocation.findUnique({
      where: {
        employeeId_companyId_year_leaveType: {
          employeeId: resolvedEmployeeId,
          companyId,
          year,
          leaveType: dto.type,
        },
      },
    });
    if (
      allocation &&
      allocation.usedDays + daysRequested > allocation.totalDays
    ) {
      throw new BadRequestException('Insufficient leave balance');
    }

    const leave = await this.prisma.leaveRequest.create({
      data: {
        employeeId: resolvedEmployeeId,
        companyId,
        startDate: start,
        endDate: end,
        type: dto.type,
        reason: dto.reason,
        documentUrl: dto.documentUrl,
      },
      include: {
        employeesLeaveRequestsEmployeeIdToemployees: {
          include: { users: true },
        },
      },
    });
    await this.eventPublisher?.publish(this.prisma, {
      eventType: DomainEventTypes.LEAVE_REQUESTED,
      entityId: leave.id,
      entityType: 'LeaveRequest',
      companyId,
      payload: {
        companyId,
        leaveRequestId: leave.id,
        employeeId: resolvedEmployeeId,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        leaveType: dto.type,
      },
    });

    const employeeUser =
      leave.employeesLeaveRequestsEmployeeIdToemployees?.users;
    if (employeeUser) {
      this.eventEmitter.emit(NotificationEvents.LeaveRequested, {
        userId: employeeUser.id,
        companyId,
        title: 'Leave Request Submitted',
        message: `Your ${dto.type.toLowerCase()} leave (${dto.startDate} - ${dto.endDate}) has been submitted`,
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
          employeesLeaveRequestsEmployeeIdToemployees: {
            employeeCode: { contains: search, mode: 'insensitive' },
          },
        },
        {
          employeesLeaveRequestsEmployeeIdToemployees: {
            users: { firstName: { contains: search, mode: 'insensitive' } },
          },
        },
        {
          employeesLeaveRequestsEmployeeIdToemployees: {
            users: { lastName: { contains: search, mode: 'insensitive' } },
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
          employeesLeaveRequestsEmployeeIdToemployees: {
            include: { users: true, departments: true },
          },
          employeesLeaveRequestsApprovedByIdToemployees: {
            include: { users: true },
          },
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
        employeesLeaveRequestsEmployeeIdToemployees: {
          include: { users: true, departments: true },
        },
        employeesLeaveRequestsApprovedByIdToemployees: {
          include: { users: true },
        },
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
      include: {
        employeesLeaveRequestsEmployeeIdToemployees: {
          include: { users: true },
        },
      },
    });
  }

  async approve(
    id: string,
    dto: ApproveLeaveRequestDto,
    userId: string,
    companyId: string,
    userRole: string,
  ) {
    const leave = await this.findOne(id, companyId);

    this.transitionService.validate('LeaveRequest', leave.status, dto.status);

    if (
      userRole !== UserRole.OWNER &&
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.HR_MANAGER
    ) {
      throw new ForbiddenException(
        'You do not have permission to approve leave requests',
      );
    }

    if (userRole !== UserRole.OWNER) {
      throw new ForbiddenException(
        'Medical leave can only be approved by the Owner',
      );
    }

    const employee = await this.employeesService.findByUserId(userId);

    // Prevent self-approval
    if (leave.employeeId === employee?.id) {
      throw new ForbiddenException('Cannot approve your own leave request');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.leaveRequest.update({
        where: { id },
        data: {
          status: dto.status,
          approvedById: employee?.id ?? null,
          approvedAt: new Date(),
        },
        include: {
          employeesLeaveRequestsEmployeeIdToemployees: {
            include: { users: true },
          },
          employeesLeaveRequestsApprovedByIdToemployees: {
            include: { users: true },
          },
        },
      });

      if (dto.status === LeaveStatus.APPROVED) {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const days =
          Math.floor(
            (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
          ) + 1;
        const year = start.getFullYear();

        await tx.leaveAllocation.upsert({
          where: {
            employeeId_companyId_year_leaveType: {
              employeeId: leave.employeeId,
              companyId,
              year,
              leaveType: leave.type,
            },
          },
          create: {
            employeeId: leave.employeeId,
            companyId,
            year,
            leaveType: leave.type,
            totalDays: 3,
            usedDays: days,
          },
          update: {
            usedDays: { increment: days },
          },
        });
      }

      await this.eventPublisher?.publish(tx, {
        eventType:
          dto.status === LeaveStatus.APPROVED
            ? DomainEventTypes.LEAVE_APPROVED
            : DomainEventTypes.LEAVE_REJECTED,
        entityId: id,
        entityType: 'LeaveRequest',
        companyId,
        payload: {
          companyId,
          leaveRequestId: id,
          employeeId: leave.employeeId,
          status: dto.status,
        },
      });

      return result;
    });

    const employeeUser =
      updated.employeesLeaveRequestsEmployeeIdToemployees?.users;
    if (employeeUser) {
      const isApproved = dto.status === LeaveStatus.APPROVED;
      const eventName = isApproved
        ? NotificationEvents.LeaveApproved
        : NotificationEvents.LeaveRejected;
      this.eventEmitter.emit(eventName, {
        userId: employeeUser.id,
        companyId,
        title: isApproved ? 'Leave Approved' : 'Leave Rejected',
        message: `Your ${leave.type.toLowerCase()} leave request has been ${isApproved ? 'approved' : 'rejected'}`,
        type: isApproved ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
        link: `/leave-requests/${id}`,
      });
    }

    return updated;
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.leaveRequest.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getPendingCount(companyId: string, employeeId?: string) {
    return this.prisma.leaveRequest.count({
      where: {
        status: LeaveStatus.PENDING,
        companyId,
        ...(employeeId ? { employeeId } : {}),
      },
    });
  }

  // ── Cross-module query methods ──────────────────────────────────
  // These methods provide a clean service-layer API for other modules
  // that need leave data, replacing direct Prisma.leaveRequest queries.

  /** Approved leave for a specific employee on a specific date — used by AttendanceService during punch. */
  async findApprovedLeaveForDate(employeeId: string, companyId: string, date: Date) {
    return this.prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        companyId,
        status: 'APPROVED',
        startDate: { lte: date },
        endDate: { gte: date },
      },
    });
  }

  /** Count of approved leaves for a company on a specific date — used by Attendance stats/dashboard. */
  async countApprovedLeaves(companyId: string, date: Date) {
    return this.prisma.leaveRequest.count({
      where: {
        companyId,
        status: 'APPROVED',
        startDate: { lte: date },
        endDate: { gte: date },
      },
    });
  }
}
