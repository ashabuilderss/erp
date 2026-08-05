"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveRequestsService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../../../config/prisma.service");
const transition_service_1 = require("../../../common/services/transition.service");
const employees_service_1 = require("../employees/employees.service");
const client_1 = require("@prisma/client");
const sort_by_1 = require("../../../common/utils/sort-by");
const notification_events_1 = require("../../notifications/events/notification-events");
const governance_event_publisher_1 = require("../../governance-events/governance-event.publisher");
const events_1 = require("../../governance-events/types/events");
const ALLOWED_SORT = [
    'createdAt',
    'updatedAt',
    'startDate',
    'endDate',
    'status',
    'type',
];
let LeaveRequestsService = class LeaveRequestsService {
    prisma;
    eventEmitter;
    transitionService;
    employeesService;
    eventPublisher;
    constructor(prisma, eventEmitter, transitionService, employeesService, eventPublisher) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
        this.transitionService = transitionService;
        this.employeesService = employeesService;
        this.eventPublisher = eventPublisher;
    }
    async createMyLeaveRequest(dto, employeeId, companyId) {
        return this.create(dto, companyId, employeeId);
    }
    async create(dto, companyId, employeeIdOverride) {
        const resolvedEmployeeId = employeeIdOverride ?? dto.employeeId;
        const employee = await this.employeesService.findBasicById(resolvedEmployeeId);
        if (!employee)
            throw new common_1.BadRequestException(`Employee with ID ${resolvedEmployeeId} not found`);
        if (employee.companyId !== companyId)
            throw new common_1.BadRequestException(`Employee with ID ${resolvedEmployeeId} does not belong to this company`);
        if (dto.type !== 'MEDICAL') {
            throw new common_1.BadRequestException('Only medical emergency leave is supported');
        }
        const start = new Date(dto.startDate);
        const end = new Date(dto.endDate);
        if (start > end)
            throw new common_1.BadRequestException('Start date must be before or equal to end date');
        const daysRequested = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        if (daysRequested > 3) {
            throw new common_1.BadRequestException('Leave cannot exceed 3 consecutive days');
        }
        if (!dto.documentUrl) {
            throw new common_1.BadRequestException('Medical leave requires a supporting document upload');
        }
        if (!dto.reason) {
            throw new common_1.BadRequestException('Medical leave requires a reason');
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
        if (allocation &&
            allocation.usedDays + daysRequested > allocation.totalDays) {
            throw new common_1.BadRequestException('Insufficient leave balance');
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
            eventType: events_1.DomainEventTypes.LEAVE_REQUESTED,
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
        const employeeUser = leave.employeesLeaveRequestsEmployeeIdToemployees?.users;
        if (employeeUser) {
            this.eventEmitter.emit(notification_events_1.NotificationEvents.LeaveRequested, {
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
    async findAll(query, companyId, employeeIdOverride) {
        const { page = 1, limit = 10, employeeId, status, type, startDateFrom, endDateTo, search, sortBy = 'createdAt', sortOrder = 'desc', } = query;
        const where = { companyId };
        if (employeeIdOverride) {
            where.employeeId = employeeIdOverride;
        }
        else if (employeeId) {
            where.employeeId = employeeId;
        }
        if (status)
            where.status = status;
        if (type)
            where.type = type;
        if (startDateFrom || endDateTo) {
            where.startDate = {};
            if (startDateFrom)
                where.startDate.gte = new Date(startDateFrom);
            if (endDateTo)
                where.startDate.lte = new Date(endDateTo);
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
                orderBy: { [(0, sort_by_1.safeSortBy)(sortBy, ALLOWED_SORT, 'createdAt')]: sortOrder },
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
    async findOne(id, companyId, employeeIdOverride) {
        const where = { id, companyId };
        if (employeeIdOverride)
            where.employeeId = employeeIdOverride;
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
            throw new common_1.NotFoundException(`Leave request with ID ${id} not found`);
        return leave;
    }
    async update(id, dto, companyId, employeeIdOverride) {
        await this.findOne(id, companyId, employeeIdOverride);
        const data = { ...dto };
        if (dto.startDate !== undefined)
            data.startDate = new Date(dto.startDate);
        if (dto.endDate !== undefined)
            data.endDate = new Date(dto.endDate);
        if (dto.startDate && dto.endDate) {
            if (new Date(dto.startDate) > new Date(dto.endDate)) {
                throw new common_1.BadRequestException('Start date must be before or equal to end date');
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
    async approve(id, dto, userId, companyId, userRole) {
        const leave = await this.findOne(id, companyId);
        this.transitionService.validate('LeaveRequest', leave.status, dto.status);
        if (userRole !== client_1.UserRole.OWNER &&
            userRole !== client_1.UserRole.ADMIN &&
            userRole !== client_1.UserRole.HR_MANAGER) {
            throw new common_1.ForbiddenException('You do not have permission to approve leave requests');
        }
        if (userRole !== client_1.UserRole.OWNER) {
            throw new common_1.ForbiddenException('Medical leave can only be approved by the Owner');
        }
        const employee = await this.employeesService.findByUserId(userId);
        if (leave.employeeId === employee?.id) {
            throw new common_1.ForbiddenException('Cannot approve your own leave request');
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
            if (dto.status === client_1.LeaveStatus.APPROVED) {
                const start = new Date(leave.startDate);
                const end = new Date(leave.endDate);
                const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
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
                eventType: dto.status === client_1.LeaveStatus.APPROVED
                    ? events_1.DomainEventTypes.LEAVE_APPROVED
                    : events_1.DomainEventTypes.LEAVE_REJECTED,
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
        const employeeUser = updated.employeesLeaveRequestsEmployeeIdToemployees?.users;
        if (employeeUser) {
            const isApproved = dto.status === client_1.LeaveStatus.APPROVED;
            const eventName = isApproved
                ? notification_events_1.NotificationEvents.LeaveApproved
                : notification_events_1.NotificationEvents.LeaveRejected;
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
    async remove(id, companyId) {
        await this.findOne(id, companyId);
        return this.prisma.leaveRequest.update({ where: { id }, data: { deletedAt: new Date() } });
    }
    async getPendingCount(companyId, employeeId) {
        return this.prisma.leaveRequest.count({
            where: {
                status: client_1.LeaveStatus.PENDING,
                companyId,
                ...(employeeId ? { employeeId } : {}),
            },
        });
    }
    async findApprovedLeaveForDate(employeeId, companyId, date) {
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
    async countApprovedLeaves(companyId, date) {
        return this.prisma.leaveRequest.count({
            where: {
                companyId,
                status: 'APPROVED',
                startDate: { lte: date },
                endDate: { gte: date },
            },
        });
    }
};
exports.LeaveRequestsService = LeaveRequestsService;
exports.LeaveRequestsService = LeaveRequestsService = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2,
        transition_service_1.TransitionService,
        employees_service_1.EmployeesService,
        governance_event_publisher_1.GovernanceEventPublisher])
], LeaveRequestsService);
//# sourceMappingURL=leave-requests.service.js.map