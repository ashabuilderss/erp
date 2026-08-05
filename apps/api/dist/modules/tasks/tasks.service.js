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
var TasksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
const client_1 = require("@prisma/client");
const governance_event_publisher_1 = require("../governance-events/governance-event.publisher");
const events_1 = require("../governance-events/types/events");
let TasksService = TasksService_1 = class TasksService {
    prisma;
    eventPublisher;
    logger = new common_1.Logger(TasksService_1.name);
    constructor(prisma, eventPublisher) {
        this.prisma = prisma;
        this.eventPublisher = eventPublisher;
    }
    validateDueDateSla(priority, dueDate, override = false) {
        if (override)
            return;
        const now = new Date();
        const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        let requiredHours = 24;
        if (priority === client_1.TaskPriority.CRITICAL)
            requiredHours = 4;
        else if (priority === client_1.TaskPriority.IMPORTANT)
            requiredHours = 12;
        if (diffHours < requiredHours) {
            throw new common_1.BadRequestException(`Due date SLA violated. Priority ${priority} requires at least ${requiredHours} hours.`);
        }
    }
    async createTask(companyId, creatorId, dto, isOwner) {
        const dueDate = new Date(dto.dueDate);
        const now = new Date();
        let slaDeadline = null;
        if (dto.slaHours) {
            slaDeadline = new Date(now.getTime() + dto.slaHours * 60 * 60 * 1000);
            if (dueDate < slaDeadline) {
                slaDeadline = dueDate;
            }
        }
        const creator = await this.prisma.employee.findFirst({
            where: { userId: creatorId, companyId },
        });
        if (!creator)
            throw new common_1.BadRequestException('Creator employee profile not found.');
        if (!dto.slaHours) {
            this.validateDueDateSla(dto.priority, dueDate, isOwner);
        }
        return await this.prisma.$transaction(async (tx) => {
            const task = await tx.task.create({
                data: {
                    companyId,
                    creatorId: creator.id,
                    assigneeId: dto.assigneeId,
                    category: dto.category,
                    title: dto.title,
                    description: dto.description,
                    priority: dto.priority,
                    dueDate,
                    status: client_1.TaskStatus.PENDING,
                    slaHours: dto.slaHours || null,
                    slaDeadline: slaDeadline,
                },
            });
            await tx.taskHistory.create({
                data: {
                    taskId: task.id,
                    companyId,
                    actorId: creator.id,
                    event: 'TASK_CREATED',
                    comments: `Task created and assigned.`,
                },
            });
            await this.eventPublisher?.publish(tx, {
                eventType: events_1.DomainEventTypes.TASK_CREATED,
                entityId: task.id,
                entityType: 'Task',
                companyId,
                payload: {
                    companyId,
                    taskId: task.id,
                    assigneeId: task.assigneeId,
                    priority: task.priority,
                    dueDate: task.dueDate.toISOString(),
                    slaHours: dto.slaHours || null,
                    slaDeadline: slaDeadline?.toISOString() || null,
                },
            });
            return task;
        });
    }
    async reassignTask(companyId, taskId, actorId, dto) {
        const actor = await this.prisma.employee.findFirst({
            where: { userId: actorId, companyId },
        });
        return await this.prisma.$transaction(async (tx) => {
            const task = await tx.task.findFirst({
                where: { id: taskId, companyId },
            });
            if (!task)
                throw new common_1.NotFoundException('Task not found.');
            if (task.status === client_1.TaskStatus.COMPLETED)
                throw new common_1.BadRequestException('Cannot reassign completed task.');
            const updated = await tx.task.update({
                where: { id: taskId },
                data: {
                    assigneeId: dto.newAssigneeId,
                    acknowledgedAt: null,
                    status: client_1.TaskStatus.PENDING,
                },
            });
            await tx.taskHistory.create({
                data: {
                    taskId,
                    companyId,
                    actorId: actor?.id,
                    event: 'TASK_REASSIGNED',
                    comments: dto.comments || 'Task reassigned.',
                },
            });
            return updated;
        });
    }
    async cancelTask(companyId, taskId, actorId) {
        const actor = await this.prisma.employee.findFirst({
            where: { userId: actorId, companyId },
        });
        return await this.prisma.$transaction(async (tx) => {
            const task = await tx.task.findFirst({
                where: { id: taskId, companyId },
            });
            if (!task)
                throw new common_1.NotFoundException('Task not found');
            if (task.status === client_1.TaskStatus.CANCELLED) {
                throw new common_1.BadRequestException('Task is already cancelled.');
            }
            if (task.status === client_1.TaskStatus.COMPLETED) {
                throw new common_1.BadRequestException('Cannot cancel a completed task.');
            }
            const updated = await tx.task.update({
                where: { id: taskId },
                data: { status: client_1.TaskStatus.CANCELLED },
            });
            await tx.taskHistory.create({
                data: {
                    taskId,
                    companyId,
                    event: 'TASK_CANCELLED',
                    actorId: actor?.id ?? null,
                    comments: 'Task cancelled by operator',
                },
            });
            return updated;
        });
    }
    async acknowledgeTask(companyId, taskId, actorId) {
        const actor = await this.prisma.employee.findFirst({
            where: { userId: actorId, companyId },
        });
        return await this.prisma.$transaction(async (tx) => {
            const task = await tx.task.findFirst({
                where: { id: taskId, companyId, status: client_1.TaskStatus.PENDING },
            });
            if (!task)
                throw new common_1.BadRequestException('Task not found or not in PENDING state.');
            if (actor && task.assigneeId !== actor.id) {
                throw new common_1.BadRequestException('Only the assignee can acknowledge the task.');
            }
            const updated = await tx.task.update({
                where: { id: taskId },
                data: {
                    acknowledgedAt: new Date(),
                    status: client_1.TaskStatus.IN_PROGRESS,
                },
            });
            await tx.taskHistory.create({
                data: {
                    taskId,
                    companyId,
                    actorId: actor?.id,
                    event: 'TASK_ACKNOWLEDGED',
                    comments: 'Task acknowledged by assignee.',
                },
            });
            return updated;
        });
    }
    async findAll(companyId, query) {
        const { page = 1, limit = 10, status, priority, assigneeId, category, search } = query;
        const skip = (page - 1) * limit;
        const where = {
            companyId,
            ...(status ? { status } : {}),
            ...(priority ? { priority } : {}),
            ...(assigneeId ? { assigneeId } : {}),
            ...(category ? { category } : {}),
            ...(search
                ? {
                    OR: [
                        { title: { contains: search, mode: 'insensitive' } },
                        { description: { contains: search, mode: 'insensitive' } },
                    ],
                }
                : {}),
        };
        const [items, total] = await Promise.all([
            this.prisma.task.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    employeesTasksAssigneeIdToemployees: true,
                    employeesTasksCreatorIdToemployees: true,
                    taskCompletionApprovals: true,
                    taskProofs: {
                        where: { deletedAt: null },
                        orderBy: { submittedAt: 'desc' },
                    },
                },
            }),
            this.prisma.task.count({ where }),
        ]);
        return {
            items,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        };
    }
    async findMyTasks(companyId, userId, query) {
        const employee = await this.prisma.employee.findFirst({
            where: { userId, companyId },
        });
        if (!employee)
            throw new common_1.BadRequestException('Employee profile not found.');
        query.assigneeId = employee.id;
        return this.findAll(companyId, query);
    }
    async findOne(companyId, taskId) {
        const task = await this.prisma.task.findFirst({
            where: { id: taskId, companyId },
            include: {
                employeesTasksAssigneeIdToemployees: true,
                employeesTasksCreatorIdToemployees: true,
                taskHistories: {
                    orderBy: { createdAt: 'desc' },
                    include: { employees: true },
                },
                taskProofs: {
                    orderBy: { submittedAt: 'desc' },
                },
                taskCompletionApprovals: true,
            },
        });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        return task;
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = TasksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        governance_event_publisher_1.GovernanceEventPublisher])
], TasksService);
//# sourceMappingURL=tasks.service.js.map