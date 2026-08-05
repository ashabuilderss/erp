import { DomainEvent } from '@prisma/client';
import { GovernanceEventProcessor } from '../governance-event.processor';
import { PrismaService } from '../../../config/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
export declare class GovernanceNotificationListener {
    private readonly processor;
    private readonly prisma;
    private readonly notificationsService;
    private readonly logger;
    constructor(processor: GovernanceEventProcessor, prisma: PrismaService, notificationsService: NotificationsService);
    handleTaskCompleted(event: DomainEvent): Promise<void>;
    handleTaskCompletionAcknowledged(event: DomainEvent): Promise<void>;
    handleDocumentUploaded(event: DomainEvent): Promise<void>;
    handleDocumentDeleted(event: DomainEvent): Promise<void>;
    handleLeadStatusChanged(event: DomainEvent): Promise<void>;
    handleSiteVisitCompleted(event: DomainEvent): Promise<void>;
    handleBookingCreated(event: DomainEvent): Promise<void>;
    handlePropertyCreated(event: DomainEvent): Promise<void>;
    handlePropertyStatusChanged(event: DomainEvent): Promise<void>;
    handlePayrollProcessed(event: DomainEvent): Promise<void>;
    handleAttendanceFinalized(event: DomainEvent): Promise<void>;
    private notifyOwners;
    handleApprovalApproved(event: DomainEvent): Promise<void>;
    handleApprovalRejected(event: DomainEvent): Promise<void>;
    private onApprovalOutcome;
    handlePayrollHoldReleaseRequested(event: DomainEvent): Promise<void>;
}
