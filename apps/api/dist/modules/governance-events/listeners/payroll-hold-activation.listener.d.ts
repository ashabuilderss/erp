import { DomainEvent } from '@prisma/client';
import { GovernanceEventProcessor } from '../governance-event.processor';
import { GovernanceEventPublisher } from '../governance-event.publisher';
import { PrismaService } from '../../../config/prisma.service';
export declare class PayrollHoldActivationListener {
    private readonly processor;
    private readonly publisher;
    private readonly prisma;
    private readonly logger;
    constructor(processor: GovernanceEventProcessor, publisher: GovernanceEventPublisher, prisma: PrismaService);
    handleApprovalApproved(event: DomainEvent): Promise<void>;
}
