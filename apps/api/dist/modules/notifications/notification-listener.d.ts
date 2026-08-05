import { NotificationsService } from './notifications.service';
import type { NotificationEventPayload } from './events/notification-events';
export declare class NotificationListener {
    private notificationsService;
    constructor(notificationsService: NotificationsService);
    handleLeadAssigned(payload: NotificationEventPayload): Promise<{
        link: string | null;
        type: string;
        id: string;
        createdAt: Date;
        companyId: string;
        deletedAt: Date | null;
        userId: string;
        message: string;
        title: string;
        acknowledgedAt: Date | null;
        read: boolean;
    } | null>;
    handleLeadConverted(payload: NotificationEventPayload): Promise<{
        link: string | null;
        type: string;
        id: string;
        createdAt: Date;
        companyId: string;
        deletedAt: Date | null;
        userId: string;
        message: string;
        title: string;
        acknowledgedAt: Date | null;
        read: boolean;
    } | null>;
    handleLeaveRequested(payload: NotificationEventPayload): Promise<{
        link: string | null;
        type: string;
        id: string;
        createdAt: Date;
        companyId: string;
        deletedAt: Date | null;
        userId: string;
        message: string;
        title: string;
        acknowledgedAt: Date | null;
        read: boolean;
    } | null>;
    handleLeaveApproved(payload: NotificationEventPayload): Promise<{
        link: string | null;
        type: string;
        id: string;
        createdAt: Date;
        companyId: string;
        deletedAt: Date | null;
        userId: string;
        message: string;
        title: string;
        acknowledgedAt: Date | null;
        read: boolean;
    } | null>;
    handleLeaveRejected(payload: NotificationEventPayload): Promise<{
        link: string | null;
        type: string;
        id: string;
        createdAt: Date;
        companyId: string;
        deletedAt: Date | null;
        userId: string;
        message: string;
        title: string;
        acknowledgedAt: Date | null;
        read: boolean;
    } | null>;
    handleSiteVisitScheduled(payload: NotificationEventPayload): Promise<{
        link: string | null;
        type: string;
        id: string;
        createdAt: Date;
        companyId: string;
        deletedAt: Date | null;
        userId: string;
        message: string;
        title: string;
        acknowledgedAt: Date | null;
        read: boolean;
    } | null>;
    handleBookingConfirmed(payload: NotificationEventPayload): Promise<{
        link: string | null;
        type: string;
        id: string;
        createdAt: Date;
        companyId: string;
        deletedAt: Date | null;
        userId: string;
        message: string;
        title: string;
        acknowledgedAt: Date | null;
        read: boolean;
    } | null>;
    handleEmployeeInvited(payload: NotificationEventPayload): Promise<{
        link: string | null;
        type: string;
        id: string;
        createdAt: Date;
        companyId: string;
        deletedAt: Date | null;
        userId: string;
        message: string;
        title: string;
        acknowledgedAt: Date | null;
        read: boolean;
    } | null>;
    handleNotificationCreated(notification: {
        userId: string;
        [key: string]: unknown;
    }): void;
}
