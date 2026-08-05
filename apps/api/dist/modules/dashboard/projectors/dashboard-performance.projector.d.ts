import { DomainEvent } from '@prisma/client';
import { PrismaService } from '../../../config/prisma.service';
import { GovernanceEventProcessor } from '../../governance-events/governance-event.processor';
export declare class DashboardPerformanceProjector {
    private readonly prisma;
    private readonly processor;
    constructor(prisma: PrismaService, processor: GovernanceEventProcessor);
    handlePerformanceScoreCalculated(event: DomainEvent): Promise<void>;
    handleManagerRatingRecorded(event: DomainEvent): Promise<void>;
}
