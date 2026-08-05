import { NotificationsService } from './notifications.service';
import { QueryNotificationDto } from './dto/query-notification.dto';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(query: QueryNotificationDto, userId: string): Promise<{
        data: {
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
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getUnreadCount(userId: string): Promise<{
        count: number;
    }>;
    getUnacknowledgedCount(userId: string): Promise<{
        count: number;
    }>;
    markAsRead(id: string, userId: string): Promise<{
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
    }>;
    acknowledge(id: string, userId: string): Promise<{
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
    }>;
    markAllAsRead(userId: string): Promise<{
        success: boolean;
    }>;
}
