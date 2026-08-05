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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const notifications_service_1 = require("./notifications.service");
const notification_events_1 = require("./events/notification-events");
let NotificationListener = class NotificationListener {
    notificationsService;
    constructor(notificationsService) {
        this.notificationsService = notificationsService;
    }
    handleLeadAssigned(payload) {
        return this.notificationsService.create(payload);
    }
    handleLeadConverted(payload) {
        return this.notificationsService.create(payload);
    }
    handleLeaveRequested(payload) {
        return this.notificationsService.create(payload);
    }
    handleLeaveApproved(payload) {
        return this.notificationsService.create(payload);
    }
    handleLeaveRejected(payload) {
        return this.notificationsService.create(payload);
    }
    handleSiteVisitScheduled(payload) {
        return this.notificationsService.create(payload);
    }
    handleBookingConfirmed(payload) {
        return this.notificationsService.create(payload);
    }
    handleEmployeeInvited(payload) {
        return this.notificationsService.create(payload);
    }
    handleNotificationCreated(notification) {
        this.notificationsService.pushToUser(notification.userId, notification);
    }
};
exports.NotificationListener = NotificationListener;
__decorate([
    (0, event_emitter_1.OnEvent)(notification_events_1.NotificationEvents.LeadAssigned),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationListener.prototype, "handleLeadAssigned", null);
__decorate([
    (0, event_emitter_1.OnEvent)(notification_events_1.NotificationEvents.LeadConverted),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationListener.prototype, "handleLeadConverted", null);
__decorate([
    (0, event_emitter_1.OnEvent)(notification_events_1.NotificationEvents.LeaveRequested),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationListener.prototype, "handleLeaveRequested", null);
__decorate([
    (0, event_emitter_1.OnEvent)(notification_events_1.NotificationEvents.LeaveApproved),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationListener.prototype, "handleLeaveApproved", null);
__decorate([
    (0, event_emitter_1.OnEvent)(notification_events_1.NotificationEvents.LeaveRejected),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationListener.prototype, "handleLeaveRejected", null);
__decorate([
    (0, event_emitter_1.OnEvent)(notification_events_1.NotificationEvents.SiteVisitScheduled),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationListener.prototype, "handleSiteVisitScheduled", null);
__decorate([
    (0, event_emitter_1.OnEvent)(notification_events_1.NotificationEvents.BookingConfirmed),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationListener.prototype, "handleBookingConfirmed", null);
__decorate([
    (0, event_emitter_1.OnEvent)(notification_events_1.NotificationEvents.EmployeeInvited),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationListener.prototype, "handleEmployeeInvited", null);
__decorate([
    (0, event_emitter_1.OnEvent)(notification_events_1.NotificationEvents.NotificationCreated),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationListener.prototype, "handleNotificationCreated", null);
exports.NotificationListener = NotificationListener = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], NotificationListener);
//# sourceMappingURL=notification-listener.js.map