import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from './notifications.service';
import { NotificationEvents } from './events/notification-events';
import type { NotificationEventPayload } from './events/notification-events';

@Injectable()
export class NotificationListener {
  constructor(private notificationsService: NotificationsService) {}

  @OnEvent(NotificationEvents.LeadAssigned)
  handleLeadAssigned(payload: NotificationEventPayload) {
    return this.notificationsService.create(payload);
  }

  @OnEvent(NotificationEvents.LeadConverted)
  handleLeadConverted(payload: NotificationEventPayload) {
    return this.notificationsService.create(payload);
  }

  @OnEvent(NotificationEvents.LeaveRequested)
  handleLeaveRequested(payload: NotificationEventPayload) {
    return this.notificationsService.create(payload);
  }

  @OnEvent(NotificationEvents.LeaveApproved)
  handleLeaveApproved(payload: NotificationEventPayload) {
    return this.notificationsService.create(payload);
  }

  @OnEvent(NotificationEvents.LeaveRejected)
  handleLeaveRejected(payload: NotificationEventPayload) {
    return this.notificationsService.create(payload);
  }

  @OnEvent(NotificationEvents.SiteVisitScheduled)
  handleSiteVisitScheduled(payload: NotificationEventPayload) {
    return this.notificationsService.create(payload);
  }

  @OnEvent(NotificationEvents.BookingConfirmed)
  handleBookingConfirmed(payload: NotificationEventPayload) {
    return this.notificationsService.create(payload);
  }

  @OnEvent(NotificationEvents.EmployeeInvited)
  handleEmployeeInvited(payload: NotificationEventPayload) {
    return this.notificationsService.create(payload);
  }

  @OnEvent(NotificationEvents.NotificationCreated)
  handleNotificationCreated(notification: {
    userId: string;
    [key: string]: unknown;
  }) {
    this.notificationsService.pushToUser(notification.userId, notification);
  }
}
