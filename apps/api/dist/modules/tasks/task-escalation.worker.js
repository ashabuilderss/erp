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
var TaskEscalationWorker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskEscalationWorker = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../config/prisma.service");
const client_1 = require("@prisma/client");
const governance_event_publisher_1 = require("../governance-events/governance-event.publisher");
const events_1 = require("../governance-events/types/events");
let TaskEscalationWorker = TaskEscalationWorker_1 = class TaskEscalationWorker {
    prisma;
    eventPublisher;
    logger = new common_1.Logger(TaskEscalationWorker_1.name);
    constructor(prisma, eventPublisher) {
        this.prisma = prisma;
        this.eventPublisher = eventPublisher;
    }
    async handleTaskEscalations() {
        this.logger.debug('Running Task Escalation Worker...');
        const now = new Date();
        const priorities = [
            client_1.TaskPriority.CRITICAL,
            client_1.TaskPriority.IMPORTANT,
            client_1.TaskPriority.NORMAL,
        ];
        for (const priority of priorities) {
            await this.processAcknowledgmentBreaches(priority, now);
            await this.processDueDateBreaches(priority, now);
        }
        await this.processSlaReminders(now);
        await this.processSlaBreaches(now);
    }
    async processAcknowledgmentBreaches(priority, now) {
        let allowedHours = 24;
        if (priority === client_1.TaskPriority.CRITICAL)
            allowedHours = 4;
        else if (priority === client_1.TaskPriority.IMPORTANT)
            allowedHours = 12;
        const thresholdDate = new Date(now.getTime() - allowedHours * 60 * 60 * 1000);
        const breachedTasks = await this.prisma.task.findMany({
            where: {
                status: client_1.TaskStatus.PENDING,
                priority: priority,
                createdAt: { lt: thresholdDate },
                escalationLevel: 0,
            },
        });
        for (const task of breachedTasks) {
            await this.prisma.$transaction(async (tx) => {
                const currentTask = await tx.task.findUnique({
                    where: { id: task.id },
                });
                if (!currentTask || currentTask.status !== client_1.TaskStatus.PENDING || currentTask.escalationLevel > 0)
                    return;
                await tx.task.update({
                    where: { id: task.id },
                    data: { escalationLevel: 1 },
                });
                await tx.taskHistory.create({
                    data: {
                        taskId: task.id,
                        companyId: currentTask.companyId,
                        event: 'SLA_BREACH_ACKNOWLEDGMENT',
                        comments: `Task acknowledgment SLA breached. Stage 1 Reminder sent.`,
                    },
                });
            });
        }
    }
    getEscalationDelayHours(priority) {
        switch (priority) {
            case client_1.TaskPriority.CRITICAL: return 4;
            case client_1.TaskPriority.IMPORTANT: return 12;
            case client_1.TaskPriority.NORMAL: return 24;
            default: return 24;
        }
    }
    async processDueDateBreaches(priority, now) {
        const breachedTasks = await this.prisma.task.findMany({
            where: {
                status: { notIn: [client_1.TaskStatus.COMPLETED, client_1.TaskStatus.CANCELLED] },
                priority: priority,
                dueDate: { lt: now },
            },
        });
        for (const task of breachedTasks) {
            await this.prisma.$transaction(async (tx) => {
                const currentTask = await tx.task.findUnique({
                    where: { id: task.id },
                });
                if (!currentTask || currentTask.status === client_1.TaskStatus.COMPLETED || currentTask.status === client_1.TaskStatus.CANCELLED || currentTask.dueDate >= now)
                    return;
                const hoursOverdue = (now.getTime() - currentTask.dueDate.getTime()) / (1000 * 60 * 60);
                const intervalHours = this.getEscalationDelayHours(priority);
                const expectedLevel = Math.floor(hoursOverdue / intervalHours) + 1;
                if (expectedLevel > currentTask.escalationLevel) {
                    const nextLevel = currentTask.escalationLevel + 1;
                    let statusUpdate = currentTask.status;
                    if (currentTask.status !== client_1.TaskStatus.OVERDUE) {
                        statusUpdate = client_1.TaskStatus.OVERDUE;
                    }
                    await tx.task.update({
                        where: { id: task.id },
                        data: {
                            status: statusUpdate,
                            escalationLevel: nextLevel,
                        },
                    });
                    let actionDescription = 'Escalation level increased.';
                    let eventToEmit = null;
                    if (nextLevel === 1) {
                        actionDescription = 'Task Overdue - Stage 1 Reminder Sent.';
                    }
                    else if (nextLevel === 2) {
                        if (priority === client_1.TaskPriority.CRITICAL) {
                            actionDescription = 'Task Overdue Stage 2 - Warning Issued.';
                            eventToEmit = events_1.DomainEventTypes.TASK_OVERDUE;
                        }
                        else {
                            actionDescription = 'Task Overdue Stage 2 - Escalated to Manager.';
                            eventToEmit = events_1.DomainEventTypes.TASK_ESCALATED_MANAGER;
                        }
                    }
                    else if (nextLevel === 3) {
                        if (priority === client_1.TaskPriority.CRITICAL) {
                            actionDescription = 'Task Overdue Stage 3 - Escalated to HR.';
                            eventToEmit = events_1.DomainEventTypes.TASK_ESCALATED_HR;
                        }
                        else {
                            actionDescription = 'Task Overdue Stage 3 - Warning Issued.';
                            eventToEmit = events_1.DomainEventTypes.TASK_OVERDUE;
                        }
                    }
                    else if (nextLevel === 4 && priority !== client_1.TaskPriority.CRITICAL) {
                        actionDescription = 'Task Overdue Stage 4 - Escalated to HR.';
                        eventToEmit = events_1.DomainEventTypes.TASK_ESCALATED_HR;
                    }
                    await tx.taskHistory.create({
                        data: {
                            taskId: task.id,
                            companyId: currentTask.companyId,
                            event: 'SLA_BREACH_DUE_DATE',
                            comments: actionDescription,
                        },
                    });
                    if (eventToEmit) {
                        await this.eventPublisher.publish(tx, {
                            eventType: eventToEmit,
                            entityType: 'TASK',
                            entityId: task.id,
                            companyId: currentTask.companyId,
                            payload: {
                                companyId: currentTask.companyId,
                                taskId: task.id,
                                assigneeId: currentTask.assigneeId,
                                priority: currentTask.priority,
                                escalationLevel: nextLevel,
                            },
                        });
                    }
                }
            });
        }
    }
    async processSlaReminders(now) {
        const reminderThreshold = new Date(now.getTime() + 30 * 60 * 1000);
        const tasksToRemind = await this.prisma.task.findMany({
            where: {
                status: { notIn: [client_1.TaskStatus.COMPLETED, client_1.TaskStatus.CANCELLED] },
                slaDeadline: { not: null, lte: reminderThreshold, gt: now },
                reminderSentAt: null,
            },
        });
        for (const task of tasksToRemind) {
            await this.prisma.$transaction(async (tx) => {
                const currentTask = await tx.task.findUnique({ where: { id: task.id } });
                if (!currentTask || currentTask.reminderSentAt)
                    return;
                await tx.task.update({
                    where: { id: task.id },
                    data: { reminderSentAt: now },
                });
                const remainingMs = currentTask.slaDeadline.getTime() - now.getTime();
                const remainingMinutes = Math.max(0, Math.floor(remainingMs / 60000));
                await this.eventPublisher.publish(tx, {
                    eventType: events_1.DomainEventTypes.TASK_SLA_REMINDER,
                    entityType: 'TASK',
                    entityId: task.id,
                    companyId: currentTask.companyId,
                    payload: {
                        companyId: currentTask.companyId,
                        taskId: task.id,
                        assigneeId: currentTask.assigneeId,
                        slaDeadline: currentTask.slaDeadline.toISOString(),
                        remainingMinutes,
                    },
                });
            });
        }
    }
    async processSlaBreaches(now) {
        const breachedTasks = await this.prisma.task.findMany({
            where: {
                status: { notIn: [client_1.TaskStatus.COMPLETED, client_1.TaskStatus.CANCELLED, client_1.TaskStatus.OVERDUE] },
                slaDeadline: { not: null, lt: now },
            },
        });
        for (const task of breachedTasks) {
            await this.prisma.$transaction(async (tx) => {
                const currentTask = await tx.task.findUnique({ where: { id: task.id } });
                if (!currentTask || currentTask.status === client_1.TaskStatus.OVERDUE || currentTask.status === client_1.TaskStatus.COMPLETED || currentTask.status === client_1.TaskStatus.CANCELLED)
                    return;
                const nextLevel = currentTask.escalationLevel === 0 ? 1 : currentTask.escalationLevel + 1;
                await tx.task.update({
                    where: { id: task.id },
                    data: {
                        status: client_1.TaskStatus.OVERDUE,
                        escalationLevel: nextLevel,
                    },
                });
                await tx.taskHistory.create({
                    data: {
                        taskId: task.id,
                        companyId: currentTask.companyId,
                        event: 'SLA_BREACH_TIME_LIMIT',
                        comments: 'Task missed hourly time limit SLA. Marked as OVERDUE.',
                    },
                });
                const breachMinutes = Math.floor((now.getTime() - currentTask.slaDeadline.getTime()) / 60000);
                await this.eventPublisher.publish(tx, {
                    eventType: events_1.DomainEventTypes.TASK_SLA_BREACHED,
                    entityType: 'TASK',
                    entityId: task.id,
                    companyId: currentTask.companyId,
                    payload: {
                        companyId: currentTask.companyId,
                        taskId: task.id,
                        assigneeId: currentTask.assigneeId,
                        creatorId: currentTask.creatorId,
                        slaHours: currentTask.slaHours,
                        breachMinutes,
                    },
                });
            });
        }
    }
};
exports.TaskEscalationWorker = TaskEscalationWorker;
__decorate([
    (0, schedule_1.Cron)('0 */15 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TaskEscalationWorker.prototype, "handleTaskEscalations", null);
exports.TaskEscalationWorker = TaskEscalationWorker = TaskEscalationWorker_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        governance_event_publisher_1.GovernanceEventPublisher])
], TaskEscalationWorker);
//# sourceMappingURL=task-escalation.worker.js.map