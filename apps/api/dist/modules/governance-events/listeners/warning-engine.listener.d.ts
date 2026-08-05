import { DomainEvent } from '@prisma/client';
import { GovernanceEventProcessor } from '../governance-event.processor';
import { PrismaService } from '../../../config/prisma.service';
import { GovernanceEventPublisher } from '../governance-event.publisher';
import { WarningsService } from '../../warnings/warnings.service';
export declare class WarningEngineListener {
    private readonly processor;
    private readonly prisma;
    private readonly publisher;
    private readonly warningsService;
    private readonly logger;
    constructor(processor: GovernanceEventProcessor, prisma: PrismaService, publisher: GovernanceEventPublisher, warningsService: WarningsService);
    handleTaskOverdue(event: DomainEvent): Promise<void>;
}
