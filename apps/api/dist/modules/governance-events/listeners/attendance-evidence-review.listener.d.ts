import { DomainEvent } from '@prisma/client';
import { GovernanceEventProcessor } from '../governance-event.processor';
import { PrismaService } from '../../../config/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
export declare class AttendanceEvidenceReviewListener {
    private readonly processor;
    private readonly prisma;
    private readonly notificationsService;
    private readonly logger;
    constructor(processor: GovernanceEventProcessor, prisma: PrismaService, notificationsService: NotificationsService);
    handleEvidencePending(event: DomainEvent): Promise<void>;
    handleEvidenceReviewed(event: DomainEvent): Promise<void>;
}
