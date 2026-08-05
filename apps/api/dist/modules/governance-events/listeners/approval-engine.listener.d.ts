import { DomainEvent } from '@prisma/client';
import { GovernanceEventProcessor } from '../governance-event.processor';
import { GovernanceEventPublisher } from '../governance-event.publisher';
import { PrismaService } from '../../../config/prisma.service';
import { ApprovalsSpawningService } from '../../approvals/approvals-spawning.service';
export declare class ApprovalEngineListener {
    private readonly processor;
    private readonly publisher;
    private readonly prisma;
    private readonly spawningService;
    private readonly logger;
    constructor(processor: GovernanceEventProcessor, publisher: GovernanceEventPublisher, prisma: PrismaService, spawningService: ApprovalsSpawningService);
    handleDisciplinaryReview(event: DomainEvent): Promise<void>;
}
