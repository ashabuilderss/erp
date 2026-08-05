import { PrismaService } from '../../config/prisma.service';
import { DomainEvent } from '@prisma/client';
export declare class GovernanceEventProcessor {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    process(event: DomainEvent, handlerName: string, handler: () => Promise<void>): Promise<void>;
}
