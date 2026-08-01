import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent } from '@prisma/client';
import { PrismaService } from '../../../config/prisma.service';
import { GovernanceEventProcessor } from '../../governance-events/governance-event.processor';
import { DomainEventTypes } from '../../governance-events/types/events';

@Injectable()
export class DashboardApprovalProjector {
  constructor(
    private readonly prisma: PrismaService,
    private readonly processor: GovernanceEventProcessor,
  ) {}

  @OnEvent(DomainEventTypes.APPROVAL_CREATED)
  async handleApprovalCreated(event: DomainEvent) {
    await this.processor.process(
      event,
      DashboardApprovalProjector.name,
      async () => {
        const payload = event.payload as any;
        const companyId = payload.companyId;
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const pendingApprovals = await (
          this.prisma as any
        ).approvalRequest.count({
          where: { companyId, status: 'PENDING' },
        });

        await (this.prisma as any).dashboardKpiSnapshot.upsert({
          where: { companyId_snapshotDate: { companyId, snapshotDate: today } },
          create: {
            companyId,
            snapshotDate: today,
            pendingApprovals,
            lastProcessedEventId: event.id,
            lastProcessedCorrelationId: event.correlationId,
          },
          update: {
            pendingApprovals,
            lastProcessedEventId: event.id,
            lastProcessedCorrelationId: event.correlationId,
            lastProjectionUpdate: new Date(),
          },
        });
      },
    );
  }

  @OnEvent(DomainEventTypes.APPROVAL_APPROVED)
  async handleApprovalApproved(event: DomainEvent) {
    await this.processor.process(
      event,
      DashboardApprovalProjector.name,
      async () => {
        const payload = event.payload as any;
        const companyId = payload.companyId;
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const pendingApprovals = await (
          this.prisma as any
        ).approvalRequest.count({
          where: { companyId, status: 'PENDING' },
        });

        await (this.prisma as any).dashboardKpiSnapshot.upsert({
          where: { companyId_snapshotDate: { companyId, snapshotDate: today } },
          create: {
            companyId,
            snapshotDate: today,
            pendingApprovals,
            lastProcessedEventId: event.id,
            lastProcessedCorrelationId: event.correlationId,
          },
          update: {
            pendingApprovals,
            lastProcessedEventId: event.id,
            lastProcessedCorrelationId: event.correlationId,
            lastProjectionUpdate: new Date(),
          },
        });
      },
    );
  }

  @OnEvent(DomainEventTypes.APPROVAL_REJECTED)
  async handleApprovalRejected(event: DomainEvent) {
    await this.processor.process(
      event,
      DashboardApprovalProjector.name,
      async () => {
        const payload = event.payload as any;
        const companyId = payload.companyId;
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const pendingApprovals = await (
          this.prisma as any
        ).approvalRequest.count({
          where: { companyId, status: 'PENDING' },
        });

        await (this.prisma as any).dashboardKpiSnapshot.upsert({
          where: { companyId_snapshotDate: { companyId, snapshotDate: today } },
          create: {
            companyId,
            snapshotDate: today,
            pendingApprovals,
            lastProcessedEventId: event.id,
            lastProcessedCorrelationId: event.correlationId,
          },
          update: {
            pendingApprovals,
            lastProcessedEventId: event.id,
            lastProcessedCorrelationId: event.correlationId,
            lastProjectionUpdate: new Date(),
          },
        });
      },
    );
  }
}
