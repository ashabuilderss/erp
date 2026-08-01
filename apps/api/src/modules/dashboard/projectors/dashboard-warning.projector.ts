import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent } from '@prisma/client';
import { PrismaService } from '../../../config/prisma.service';
import { GovernanceEventProcessor } from '../../governance-events/governance-event.processor';
import { DomainEventTypes } from '../../governance-events/types/events';

@Injectable()
export class DashboardWarningProjector {
  constructor(
    private readonly prisma: PrismaService,
    private readonly processor: GovernanceEventProcessor,
  ) {}

  @OnEvent(DomainEventTypes.WARNING_CREATED)
  async handleWarningCreated(event: DomainEvent) {
    await this.processor.process(
      event,
      DashboardWarningProjector.name,
      async () => {
        const payload = event.payload as any;
        const companyId = payload.companyId;
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const activeWarnings = await this.prisma.warning.count({
          where: { companyId, status: 'PENDING' },
        });

        await (this.prisma as any).dashboardKpiSnapshot.upsert({
          where: { companyId_snapshotDate: { companyId, snapshotDate: today } },
          create: {
            companyId,
            snapshotDate: today,
            activeWarnings,
            lastProcessedEventId: event.id,
            lastProcessedCorrelationId: event.correlationId,
          },
          update: {
            activeWarnings,
            lastProcessedEventId: event.id,
            lastProcessedCorrelationId: event.correlationId,
            lastProjectionUpdate: new Date(),
          },
        });
      },
    );
  }

  @OnEvent(DomainEventTypes.WARNING_APPROVED)
  async handleWarningApproved(event: DomainEvent) {
    await this.processor.process(
      event,
      DashboardWarningProjector.name,
      async () => {
        const payload = event.payload as any;
        const companyId = payload.companyId;
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const activeWarnings = await this.prisma.warning.count({
          where: { companyId, status: 'PENDING' },
        });

        await (this.prisma as any).dashboardKpiSnapshot.upsert({
          where: { companyId_snapshotDate: { companyId, snapshotDate: today } },
          create: {
            companyId,
            snapshotDate: today,
            activeWarnings,
            lastProcessedEventId: event.id,
            lastProcessedCorrelationId: event.correlationId,
          },
          update: {
            activeWarnings,
            lastProcessedEventId: event.id,
            lastProcessedCorrelationId: event.correlationId,
            lastProjectionUpdate: new Date(),
          },
        });
      },
    );
  }

  @OnEvent(DomainEventTypes.WARNING_REJECTED)
  async handleWarningRejected(event: DomainEvent) {
    await this.processor.process(
      event,
      DashboardWarningProjector.name,
      async () => {
        const payload = event.payload as any;
        const companyId = payload.companyId;
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const activeWarnings = await this.prisma.warning.count({
          where: { companyId, status: 'PENDING' },
        });

        await (this.prisma as any).dashboardKpiSnapshot.upsert({
          where: { companyId_snapshotDate: { companyId, snapshotDate: today } },
          create: {
            companyId,
            snapshotDate: today,
            activeWarnings,
            lastProcessedEventId: event.id,
            lastProcessedCorrelationId: event.correlationId,
          },
          update: {
            activeWarnings,
            lastProcessedEventId: event.id,
            lastProcessedCorrelationId: event.correlationId,
            lastProjectionUpdate: new Date(),
          },
        });
      },
    );
  }
}
