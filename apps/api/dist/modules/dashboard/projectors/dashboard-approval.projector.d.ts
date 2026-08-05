import { DomainEvent } from '@prisma/client';
import { PrismaService } from '../../../config/prisma.service';
import { GovernanceEventProcessor } from '../../governance-events/governance-event.processor';
export declare class DashboardApprovalProjector {
    private readonly prisma;
    private readonly processor;
    constructor(prisma: PrismaService, processor: GovernanceEventProcessor);
    handleApprovalCreated(event: DomainEvent): Promise<void>;
    handleApprovalApproved(event: DomainEvent): Promise<void>;
    handleApprovalRejected(event: DomainEvent): Promise<void>;
}
