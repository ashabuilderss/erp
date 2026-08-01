import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent } from '@prisma/client';
import { PrismaService } from '../../../config/prisma.service';
import { GovernanceEventProcessor } from '../../governance-events/governance-event.processor';
import { DomainEventTypes } from '../../governance-events/types/events';

@Injectable()
export class DashboardPayrollHoldProjector {
  constructor(
    private readonly prisma: PrismaService,
    private readonly processor: GovernanceEventProcessor,
  ) {}

  @OnEvent(DomainEventTypes.PAYROLL_HOLD_ACTIVATED)
  async handlePayrollHoldActivated(event: DomainEvent) {
    await this.processor.process(
      event,
      DashboardPayrollHoldProjector.name,
      async () => {
        const payload = event.payload as any;
        const companyId = payload.companyId;
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const activePayrollHolds = await (this.prisma as any).payrollHold.count(
          {
            where: { companyId, status: 'ACTIVE_HOLD' },
          },
        );

        await (this.prisma as any).dashboardKpiSnapshot.upsert({
          where: { companyId_snapshotDate: { companyId, snapshotDate: today } },
          create: {
            companyId,
            snapshotDate: today,
            activePayrollHolds,
            lastProcessedEventId: event.id,
            lastProcessedCorrelationId: event.correlationId,
          },
          update: {
            activePayrollHolds,
            lastProcessedEventId: event.id,
            lastProcessedCorrelationId: event.correlationId,
            lastProjectionUpdate: new Date(),
          },
        });
      },
    );
  }

  @OnEvent(DomainEventTypes.PAYROLL_HOLD_REJECTED)
  async handlePayrollHoldRejected(event: DomainEvent) {
    await this.processor.process(
      event,
      DashboardPayrollHoldProjector.name,
      async () => {
        const payload = event.payload as any;
        const companyId = payload.companyId;
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const activePayrollHolds = await (this.prisma as any).payrollHold.count(
          {
            where: { companyId, status: 'ACTIVE_HOLD' },
          },
        );

        await (this.prisma as any).dashboardKpiSnapshot.upsert({
          where: { companyId_snapshotDate: { companyId, snapshotDate: today } },
          create: {
            companyId,
            snapshotDate: today,
            activePayrollHolds,
            lastProcessedEventId: event.id,
            lastProcessedCorrelationId: event.correlationId,
          },
          update: {
            activePayrollHolds,
            lastProcessedEventId: event.id,
            lastProcessedCorrelationId: event.correlationId,
            lastProjectionUpdate: new Date(),
          },
        });
      },
    );
  }

  @OnEvent(DomainEventTypes.PAYROLL_HOLD_RELEASED)
  async handlePayrollHoldReleased(event: DomainEvent) {
    await this.processor.process(
      event,
      DashboardPayrollHoldProjector.name,
      async () => {
        const payload = event.payload as any;
        const companyId = payload.companyId;
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const activePayrollHolds = await (this.prisma as any).payrollHold.count(
          {
            where: { companyId, status: 'ACTIVE_HOLD' },
          },
        );

        await (this.prisma as any).dashboardKpiSnapshot.upsert({
          where: { companyId_snapshotDate: { companyId, snapshotDate: today } },
          create: {
            companyId,
            snapshotDate: today,
            activePayrollHolds,
            lastProcessedEventId: event.id,
            lastProcessedCorrelationId: event.correlationId,
          },
          update: {
            activePayrollHolds,
            lastProcessedEventId: event.id,
            lastProcessedCorrelationId: event.correlationId,
            lastProjectionUpdate: new Date(),
          },
        });
      },
    );
  }
}
