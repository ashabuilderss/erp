import { DomainEvent } from '@prisma/client';
import { PrismaService } from '../../../config/prisma.service';
import { GovernanceEventProcessor } from '../../governance-events/governance-event.processor';
export declare class DashboardCrmProjector {
    private readonly prisma;
    private readonly processor;
    constructor(prisma: PrismaService, processor: GovernanceEventProcessor);
    handleLeadStatusChanged(event: DomainEvent): Promise<void>;
    handleSiteVisitScheduled(event: DomainEvent): Promise<void>;
    handleSiteVisitCompleted(event: DomainEvent): Promise<void>;
    handleBookingCreated(event: DomainEvent): Promise<void>;
    handleBookingConfirmed(event: DomainEvent): Promise<void>;
    handlePropertyCreated(event: DomainEvent): Promise<void>;
    handlePropertyStatusChanged(event: DomainEvent): Promise<void>;
    private recalculateCrmKpis;
}
