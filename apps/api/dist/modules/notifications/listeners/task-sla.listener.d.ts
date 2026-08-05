import { NotificationsService } from '../notifications.service';
import { DomainEvent } from '@prisma/client';
export declare class TaskSlaListener {
    private notificationsService;
    private readonly logger;
    constructor(notificationsService: NotificationsService);
    handleSlaReminder(event: DomainEvent): Promise<void>;
    handleSlaBreached(event: DomainEvent): Promise<void>;
}
