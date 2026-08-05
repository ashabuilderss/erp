import { NotificationsService } from '../notifications.service';
import { DomainEvent } from '@prisma/client';
export interface NotificationRule {
    titleTemplate: (payload: any) => string;
    messageTemplate: (payload: any) => string;
    resolveUsers: (payload: any) => string[];
    type: string;
}
export declare class NotificationRouter {
    private readonly notificationsService;
    private readonly logger;
    private readonly matrix;
    constructor(notificationsService: NotificationsService);
    private routeEvent;
    onWarningCreated(event: DomainEvent): Promise<void>;
    onPayrollHoldActivated(event: DomainEvent): Promise<void>;
    onTaskOverdueEscalated(event: DomainEvent): Promise<void>;
    onTaskCreated(event: DomainEvent): Promise<void>;
    onTaskOverdue(event: DomainEvent): Promise<void>;
}
