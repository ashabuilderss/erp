import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent } from '@prisma/client';
import { PrismaService } from '../../../config/prisma.service';
import { GovernanceEventProcessor } from '../../governance-events/governance-event.processor';
import { DomainEventTypes } from '../../governance-events/types/events';

@Injectable()
export class DashboardCrmProjector {
  constructor(
    private readonly prisma: PrismaService,
    private readonly processor: GovernanceEventProcessor,
  ) {}

  @OnEvent(DomainEventTypes.LEAD_STATUS_CHANGED)
  async handleLeadStatusChanged(event: DomainEvent) {
    await this.processor.process(
      event,
      DashboardCrmProjector.name,
      async () => {
        await this.recalculateCrmKpis(event);
      },
    );
  }

  @OnEvent(DomainEventTypes.SITE_VISIT_SCHEDULED)
  async handleSiteVisitScheduled(event: DomainEvent) {
    await this.processor.process(
      event,
      DashboardCrmProjector.name,
      async () => {
        await this.recalculateCrmKpis(event);
      },
    );
  }

  @OnEvent(DomainEventTypes.SITE_VISIT_COMPLETED)
  async handleSiteVisitCompleted(event: DomainEvent) {
    await this.processor.process(
      event,
      DashboardCrmProjector.name,
      async () => {
        await this.recalculateCrmKpis(event);
      },
    );
  }

  @OnEvent(DomainEventTypes.BOOKING_CREATED)
  async handleBookingCreated(event: DomainEvent) {
    await this.processor.process(
      event,
      DashboardCrmProjector.name,
      async () => {
        await this.recalculateCrmKpis(event);
      },
    );
  }

  @OnEvent(DomainEventTypes.BOOKING_CONFIRMED)
  async handleBookingConfirmed(event: DomainEvent) {
    await this.processor.process(
      event,
      DashboardCrmProjector.name,
      async () => {
        await this.recalculateCrmKpis(event);
      },
    );
  }

  @OnEvent(DomainEventTypes.PROPERTY_CREATED)
  async handlePropertyCreated(event: DomainEvent) {
    await this.processor.process(
      event,
      DashboardCrmProjector.name,
      async () => {
        await this.recalculateCrmKpis(event);
      },
    );
  }

  @OnEvent(DomainEventTypes.PROPERTY_STATUS_CHANGED)
  async handlePropertyStatusChanged(event: DomainEvent) {
    await this.processor.process(
      event,
      DashboardCrmProjector.name,
      async () => {
        await this.recalculateCrmKpis(event);
      },
    );
  }

  private async recalculateCrmKpis(event: DomainEvent) {
    const payload = event.payload as any;
    const companyId = payload.companyId;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const totalProperties = await this.prisma.property.count({
      where: { companyId },
    });

    const totalLeads = await this.prisma.lead.count({ where: { companyId } });
    const newLeads = await this.prisma.lead.count({
      where: { companyId, createdAt: { gte: today } },
    });
    const convertedLeads = await this.prisma.lead.count({
      where: { companyId, status: 'CONVERTED' },
    });
    const conversionRate =
      totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    const totalSiteVisits = await this.prisma.siteVisit.count({
      where: { companyId },
    });

    const totalBookings = await this.prisma.booking.count({
      where: { companyId },
    });

    const bookingAgg = await this.prisma.booking.aggregate({
      where: { companyId, status: 'CONFIRMED' },
      _sum: { amount: true },
    });
    const totalRevenue = Number(bookingAgg._sum?.amount ?? 0);

    await (this.prisma as any).dashboardKpiSnapshot.upsert({
      where: { companyId_snapshotDate: { companyId, snapshotDate: today } },
      create: {
        companyId,
        snapshotDate: today,
        totalProperties,
        totalLeads,
        newLeads,
        convertedLeads,
        conversionRate,
        totalSiteVisits,
        totalBookings,
        totalRevenue,
        lastProcessedEventId: event.id,
        lastProcessedCorrelationId: event.correlationId,
      },
      update: {
        totalProperties,
        totalLeads,
        newLeads,
        convertedLeads,
        conversionRate,
        totalSiteVisits,
        totalBookings,
        totalRevenue,
        lastProcessedEventId: event.id,
        lastProcessedCorrelationId: event.correlationId,
        lastProjectionUpdate: new Date(),
      },
    });
  }
}
