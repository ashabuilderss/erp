import { DomainEvent } from '@prisma/client';
import { PrismaService } from '../../../config/prisma.service';
import { GovernanceEventProcessor } from '../../governance-events/governance-event.processor';
export declare class DashboardPayrollHoldProjector {
    private readonly prisma;
    private readonly processor;
    constructor(prisma: PrismaService, processor: GovernanceEventProcessor);
    handlePayrollHoldActivated(event: DomainEvent): Promise<void>;
    handlePayrollHoldRejected(event: DomainEvent): Promise<void>;
    handlePayrollHoldReleased(event: DomainEvent): Promise<void>;
}
