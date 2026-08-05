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
var TaskEscalationNotificationListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskEscalationNotificationListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const governance_event_processor_1 = require("../governance-event.processor");
const events_1 = require("../types/events");
const prisma_service_1 = require("../../../config/prisma.service");
const notifications_service_1 = require("../../notifications/notifications.service");
let TaskEscalationNotificationListener = TaskEscalationNotificationListener_1 = class TaskEscalationNotificationListener {
    processor;
    prisma;
    notificationsService;
    logger = new common_1.Logger(TaskEscalationNotificationListener_1.name);
    constructor(processor, prisma, notificationsService) {
        this.processor = processor;
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    async handleEscalatedToManager(event) {
        await this.processor.process(event, 'TaskEscalationNotificationListener_handleEscalatedToManager', async () => {
            this.logger.log(`Processing TASK_ESCALATED_MANAGER for Task ID ${event.entityId}`);
            const task = await this.prisma.task.findUnique({
                where: { id: event.entityId },
                include: {
                    employeesTasksAssigneeIdToemployees: {
                        select: { managerId: true, userId: true, companyId: true },
                    },
                },
            });
            if (!task) {
                this.logger.warn(`Task ${event.entityId} not found`);
                return;
            }
            const assignee = task.employeesTasksAssigneeIdToemployees;
            if (!assignee?.managerId) {
                this.logger.warn(`No manager found for assignee of task ${event.entityId}`);
                return;
            }
            const manager = await this.prisma.employee.findUnique({
                where: { id: assignee.managerId },
                select: { userId: true },
            });
            if (!manager?.userId) {
                this.logger.warn(`Manager ${assignee.managerId} has no linked user account`);
                return;
            }
            const companyId = assignee.companyId || event.payload?.companyId || '';
            const payload = event.payload;
            await this.notificationsService.create({
                userId: manager.userId,
                companyId,
                title: 'Task Escalated to You',
                message: `Task "${task.title}" has been escalated to you for review (SLA breach).`,
                type: 'WARNING',
                link: `/dashboard/my-tasks/${task.id}`,
            });
        });
    }
    async handleEscalatedToHR(event) {
        await this.processor.process(event, 'TaskEscalationNotificationListener_handleEscalatedToHR', async () => {
            this.logger.log(`Processing TASK_ESCALATED_HR for Task ID ${event.entityId}`);
            const task = await this.prisma.task.findUnique({
                where: { id: event.entityId },
                include: {
                    companies: { select: { id: true } },
                },
            });
            if (!task) {
                this.logger.warn(`Task ${event.entityId} not found`);
                return;
            }
            const companyId = task.companyId || event.payload?.companyId || '';
            const hrUsers = await this.prisma.user.findMany({
                where: {
                    companyId,
                    role: { in: ['OWNER', 'HR_MANAGER'] },
                    deletedAt: null,
                },
                select: { id: true },
            });
            for (const user of hrUsers) {
                await this.notificationsService.create({
                    userId: user.id,
                    companyId,
                    title: 'Task Escalated to HR',
                    message: `Task "${task.title}" has been escalated to HR (critical SLA breach).`,
                    type: 'ERROR',
                    link: `/dashboard/my-tasks/${task.id}`,
                });
            }
            if (task.escalationLevel >= 3) {
                const payload = event.payload;
                await this.prisma.warning.create({
                    data: {
                        companyId,
                        employeeId: task.assigneeId,
                        category: 'TASK_PERFORMANCE',
                        severity: task.escalationLevel >= 4 ? 'LEVEL_3_FINAL' : 'LEVEL_2_WRITTEN',
                        reason: `Task "${task.title}" escalated to HR after repeated SLA breaches (level ${task.escalationLevel}).`,
                        isSystemGenerated: true,
                        status: 'PENDING',
                    },
                });
            }
        });
    }
    async handleProofEscalatedToHR(event) {
        await this.processor.process(event, 'TaskEscalationNotificationListener_handleProofEscalatedToHR', async () => {
            this.logger.log(`Processing TASK_PROOF_ESCALATED_HR for TaskProof ID ${event.entityId}`);
            const proof = await this.prisma.taskProof.findUnique({
                where: { id: event.entityId },
                include: {
                    tasks: {
                        include: {
                            employeesTasksAssigneeIdToemployees: {
                                select: { companyId: true },
                            },
                        },
                    },
                },
            });
            if (!proof) {
                this.logger.warn(`TaskProof ${event.entityId} not found`);
                return;
            }
            const companyId = proof.tasks?.employeesTasksAssigneeIdToemployees?.companyId
                || event.payload?.companyId || '';
            const hrUsers = await this.prisma.user.findMany({
                where: {
                    companyId,
                    role: { in: ['OWNER', 'HR_MANAGER'] },
                    deletedAt: null,
                },
                select: { id: true },
            });
            for (const user of hrUsers) {
                await this.notificationsService.create({
                    userId: user.id,
                    companyId,
                    title: 'Task Proof Escalated to HR',
                    message: `A task proof submission has been escalated to HR for review.`,
                    type: 'WARNING',
                    link: `/dashboard/my-tasks/${proof.taskId}`,
                });
            }
        });
    }
    async handleExtensionRequested(event) {
        await this.processor.process(event, 'TaskEscalationNotificationListener_handleExtensionRequested', async () => {
            this.logger.log(`Processing TASK_EXTENSION_REQUESTED for Task ID ${event.entityId}`);
            const task = await this.prisma.task.findUnique({
                where: { id: event.entityId },
                include: {
                    employeesTasksCreatorIdToemployees: {
                        select: { userId: true },
                    },
                    employeesTasksAssigneeIdToemployees: {
                        select: { companyId: true },
                    },
                },
            });
            if (!task) {
                this.logger.warn(`Task ${event.entityId} not found`);
                return;
            }
            const creatorUserId = task.employeesTasksCreatorIdToemployees?.userId;
            const companyId = task.employeesTasksAssigneeIdToemployees?.companyId
                || event.payload?.companyId || '';
            if (!creatorUserId) {
                this.logger.warn(`Task creator has no linked user account`);
                return;
            }
            const payload = event.payload;
            await this.notificationsService.create({
                userId: creatorUserId,
                companyId,
                title: 'Extension Requested',
                message: `An extension has been requested for task "${task.title}".`,
                type: 'INFO',
                link: `/dashboard/my-tasks/${task.id}`,
            });
        });
    }
};
exports.TaskEscalationNotificationListener = TaskEscalationNotificationListener;
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.TASK_ESCALATED_MANAGER),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TaskEscalationNotificationListener.prototype, "handleEscalatedToManager", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.TASK_ESCALATED_HR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TaskEscalationNotificationListener.prototype, "handleEscalatedToHR", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.TASK_PROOF_ESCALATED_HR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TaskEscalationNotificationListener.prototype, "handleProofEscalatedToHR", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.TASK_EXTENSION_REQUESTED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TaskEscalationNotificationListener.prototype, "handleExtensionRequested", null);
exports.TaskEscalationNotificationListener = TaskEscalationNotificationListener = TaskEscalationNotificationListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [governance_event_processor_1.GovernanceEventProcessor,
        prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], TaskEscalationNotificationListener);
//# sourceMappingURL=task-escalation-notification.listener.js.map