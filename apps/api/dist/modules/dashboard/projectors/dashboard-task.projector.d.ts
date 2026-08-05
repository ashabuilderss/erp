import { DomainEvent } from '@prisma/client';
import { PrismaService } from '../../../config/prisma.service';
import { GovernanceEventProcessor } from '../../governance-events/governance-event.processor';
export declare class DashboardTaskProjector {
    private readonly prisma;
    private readonly processor;
    constructor(prisma: PrismaService, processor: GovernanceEventProcessor);
    handleTaskCreated(event: DomainEvent): Promise<void>;
    handleTaskCompleted(event: DomainEvent): Promise<void>;
}
