import { DomainEvent } from '@prisma/client';
import { GovernanceEventProcessor } from '../governance-event.processor';
import { PrismaService } from '../../../config/prisma.service';
import { GovernanceEventPublisher } from '../governance-event.publisher';
export declare class PayrollHoldReleaseListener {
    private readonly processor;
    private readonly prisma;
    private readonly publisher;
    private readonly logger;
    constructor(processor: GovernanceEventProcessor, prisma: PrismaService, publisher: GovernanceEventPublisher);
    handleTaskCompleted(event: DomainEvent): Promise<void>;
}
