import { DomainEvent } from '@prisma/client';
import { PrismaService } from '../../../config/prisma.service';
import { GovernanceEventProcessor } from '../../governance-events/governance-event.processor';
export declare class DashboardAlertProjector {
    private readonly prisma;
    private readonly processor;
    constructor(prisma: PrismaService, processor: GovernanceEventProcessor);
    handleTaskOverdue(event: DomainEvent): Promise<void>;
    handleTaskProofRejected(event: DomainEvent): Promise<void>;
    handlePayrollHoldRecommended(event: DomainEvent): Promise<void>;
    handleWarningCreated(event: DomainEvent): Promise<void>;
    handleDisciplinaryReviewTriggered(event: DomainEvent): Promise<void>;
    handleOwnerEmergencyHold(event: DomainEvent): Promise<void>;
    private createAlert;
}
