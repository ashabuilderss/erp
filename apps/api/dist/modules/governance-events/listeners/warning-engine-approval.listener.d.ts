import { DomainEvent } from '@prisma/client';
import { GovernanceEventProcessor } from '../governance-event.processor';
import { PrismaService } from '../../../config/prisma.service';
export declare class WarningEngineApprovalListener {
    private readonly processor;
    private readonly prisma;
    private readonly logger;
    constructor(processor: GovernanceEventProcessor, prisma: PrismaService);
    handleApprovalOutcome(event: DomainEvent): Promise<void>;
}
