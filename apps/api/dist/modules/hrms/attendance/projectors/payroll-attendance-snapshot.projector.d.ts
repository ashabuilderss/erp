import { DomainEvent } from '@prisma/client';
import { PrismaService } from '../../../../config/prisma.service';
import { GovernanceEventProcessor } from '../../../governance-events/governance-event.processor';
export declare class PayrollAttendanceSnapshotProjector {
    private readonly prisma;
    private readonly processor;
    constructor(prisma: PrismaService, processor: GovernanceEventProcessor);
    handleAttendanceFinalized(event: DomainEvent): Promise<void>;
}
