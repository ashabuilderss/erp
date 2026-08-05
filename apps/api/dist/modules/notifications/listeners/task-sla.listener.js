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
var TaskSlaListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskSlaListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const notifications_service_1 = require("../notifications.service");
const events_1 = require("../../governance-events/types/events");
let TaskSlaListener = TaskSlaListener_1 = class TaskSlaListener {
    notificationsService;
    logger = new common_1.Logger(TaskSlaListener_1.name);
    constructor(notificationsService) {
        this.notificationsService = notificationsService;
    }
    async handleSlaReminder(event) {
        this.logger.log(`Received SLA reminder for task ${event.entityId}`);
        const payload = event.payload;
        await this.notificationsService.create({
            userId: payload.assigneeId,
            companyId: event.companyId,
            title: 'Task Deadline Approaching',
            message: `Task SLA deadline is in 30 minutes.`,
            type: 'TASK_SLA_REMINDER',
            link: `/dashboard/my-tasks/${event.entityId}`,
        });
    }
    async handleSlaBreached(event) {
        this.logger.log(`Received SLA breach for task ${event.entityId}`);
        const payload = event.payload;
        await this.notificationsService.create({
            userId: payload.assigneeId,
            companyId: event.companyId,
            title: 'Task SLA Breached',
            message: `You missed the time limit for task ${event.entityId}.`,
            type: 'TASK_SLA_BREACHED_ASSIGNEE',
            link: `/dashboard/my-tasks/${event.entityId}`,
        });
        if (payload.creatorId !== payload.assigneeId) {
            await this.notificationsService.create({
                userId: payload.creatorId,
                companyId: event.companyId,
                title: 'Task SLA Breached (Assignee)',
                message: `Task ${event.entityId} was not completed within the SLA time limit.`,
                type: 'TASK_SLA_BREACHED_CREATOR',
                link: `/dashboard/my-tasks/${event.entityId}`,
            });
        }
    }
};
exports.TaskSlaListener = TaskSlaListener;
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.TASK_SLA_REMINDER),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TaskSlaListener.prototype, "handleSlaReminder", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.TASK_SLA_BREACHED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TaskSlaListener.prototype, "handleSlaBreached", null);
exports.TaskSlaListener = TaskSlaListener = TaskSlaListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], TaskSlaListener);
//# sourceMappingURL=task-sla.listener.js.map