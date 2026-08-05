import { DomainEvent } from '@prisma/client';
import { PrismaService } from '../../../config/prisma.service';
import { GovernanceEventProcessor } from '../../governance-events/governance-event.processor';
export declare class DashboardWarningProjector {
    private readonly prisma;
    private readonly processor;
    constructor(prisma: PrismaService, processor: GovernanceEventProcessor);
    handleWarningCreated(event: DomainEvent): Promise<void>;
    handleWarningApproved(event: DomainEvent): Promise<void>;
    handleWarningRejected(event: DomainEvent): Promise<void>;
}
