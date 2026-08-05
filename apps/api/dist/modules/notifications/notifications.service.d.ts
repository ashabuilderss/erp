import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../config/prisma.service';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { RealtimeGateway } from '../../common/realtime/realtime.gateway';
import { NotificationDeliveryService } from './channels/delivery.service';
export declare class NotificationsService {
    private prisma;
    private eventEmitter;
    private deliveryService;
    private realtimeGateway;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2, deliveryService: NotificationDeliveryService, realtimeGateway: RealtimeGateway);
    private typeToPrefKey;
    create(dto: CreateNotificationDto): Promise<{
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
    getUnreadCount(userId: string): Promise<number>;
    getUnacknowledgedCount(userId: string): Promise<number>;
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
    markAllAsRead(userId: string): Promise<{
        success: boolean;
    }>;
    pushToUser(userId: string, data: unknown): void;
}
