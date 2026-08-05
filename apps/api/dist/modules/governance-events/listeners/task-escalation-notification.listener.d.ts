import { DomainEvent } from '@prisma/client';
import { GovernanceEventProcessor } from '../governance-event.processor';
import { PrismaService } from '../../../config/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
export declare class TaskEscalationNotificationListener {
    private readonly processor;
    private readonly prisma;
    private readonly notificationsService;
    private readonly logger;
    constructor(processor: GovernanceEventProcessor, prisma: PrismaService, notificationsService: NotificationsService);
    handleEscalatedToManager(event: DomainEvent): Promise<void>;
    handleEscalatedToHR(event: DomainEvent): Promise<void>;
    handleProofEscalatedToHR(event: DomainEvent): Promise<void>;
    handleExtensionRequested(event: DomainEvent): Promise<void>;
}
