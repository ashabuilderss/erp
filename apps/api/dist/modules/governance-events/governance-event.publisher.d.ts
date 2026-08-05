import { PrismaService } from '../../config/prisma.service';
import { DomainEventTypes, BaseDomainEventPayload } from './types/events';
import { Prisma } from '@prisma/client';
interface PublishOptions {
    eventType: DomainEventTypes;
    entityId: string;
    entityType: string;
    companyId: string;
    payload: BaseDomainEventPayload;
    correlationId?: string;
    parentEventId?: string;
    eventVersion?: number;
}
export declare class GovernanceEventPublisher {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    publish(tx: Prisma.TransactionClient, options: PublishOptions): Promise<void>;
}
export {};
