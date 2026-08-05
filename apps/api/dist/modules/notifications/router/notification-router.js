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
var NotificationRouter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationRouter = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const notifications_service_1 = require("../notifications.service");
let NotificationRouter = NotificationRouter_1 = class NotificationRouter {
    notificationsService;
    logger = new common_1.Logger(NotificationRouter_1.name);
    matrix = {
        WARNING_CREATED: {
            titleTemplate: () => 'New Warning Issued',
            messageTemplate: (p) => `You have been issued a ${p.severity} warning.`,
            resolveUsers: (p) => [p.employeeId],
            type: 'WARNING',
        },
        PAYROLL_HOLD_ACTIVATED: {
            titleTemplate: () => 'Payroll Hold Activated',
            messageTemplate: (p) => `A payroll hold has been activated for your account. Reason: ${p.reason}`,
            resolveUsers: (p) => [p.employeeId],
            type: 'PAYROLL',
        },
        TASK_OVERDUE_ESCALATED: {
            titleTemplate: () => 'Task Escalated',
            messageTemplate: (p) => `Task ${p.taskId} has been escalated to you due to overdue status.`,
            resolveUsers: (p) => (p.escalatedToUserId ? [p.escalatedToUserId] : []),
            type: 'TASK',
        },
        TASK_CREATED: {
            titleTemplate: () => 'New Task Assigned',
            messageTemplate: (p) => `You have been assigned a new task: ${p.title || p.taskId}.`,
            resolveUsers: (p) => (p.assigneeId ? [p.assigneeId] : []),
            type: 'TASK',
        },
        TASK_OVERDUE: {
            titleTemplate: () => 'Task Overdue',
            messageTemplate: (p) => `Task ${p.taskId} assigned to employee is now overdue.`,
            resolveUsers: (p) => (p.assignedByUserId ? [p.assignedByUserId] : []),
            type: 'TASK',
        },
    };
    constructor(notificationsService) {
        this.notificationsService = notificationsService;
    }
    async routeEvent(eventName, event) {
        const rule = this.matrix[eventName];
        if (!rule)
            return;
        const payload = event.payload;
        if (!payload)
            return;
        const userIds = rule.resolveUsers(payload);
        for (const userId of userIds) {
            if (!userId)
                continue;
            await this.notificationsService.create({
                companyId: payload.companyId || '',
                userId: userId,
                title: rule.titleTemplate(payload),
                message: rule.messageTemplate(payload),
                type: rule.type,
            });
        }
    }
    async onWarningCreated(event) {
        await this.routeEvent('WARNING_CREATED', event);
    }
    async onPayrollHoldActivated(event) {
        await this.routeEvent('PAYROLL_HOLD_ACTIVATED', event);
    }
    async onTaskOverdueEscalated(event) {
        await this.routeEvent('TASK_OVERDUE_ESCALATED', event);
    }
    async onTaskCreated(event) {
        await this.routeEvent('TASK_CREATED', event);
    }
    async onTaskOverdue(event) {
        await this.routeEvent('TASK_OVERDUE', event);
    }
};
exports.NotificationRouter = NotificationRouter;
__decorate([
    (0, event_emitter_1.OnEvent)('WARNING_CREATED'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationRouter.prototype, "onWarningCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)('PAYROLL_HOLD_ACTIVATED'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationRouter.prototype, "onPayrollHoldActivated", null);
__decorate([
    (0, event_emitter_1.OnEvent)('TASK_OVERDUE_ESCALATED'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationRouter.prototype, "onTaskOverdueEscalated", null);
__decorate([
    (0, event_emitter_1.OnEvent)('TASK_CREATED'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationRouter.prototype, "onTaskCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)('TASK_OVERDUE'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationRouter.prototype, "onTaskOverdue", null);
exports.NotificationRouter = NotificationRouter = NotificationRouter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], NotificationRouter);
//# sourceMappingURL=notification-router.js.map