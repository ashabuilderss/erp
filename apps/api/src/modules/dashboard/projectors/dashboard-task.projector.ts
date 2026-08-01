import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent } from '@prisma/client';
import { PrismaService } from '../../../config/prisma.service';
import { GovernanceEventProcessor } from '../../governance-events/governance-event.processor';
import { DomainEventTypes } from '../../governance-events/types/events';

@Injectable()
export class DashboardTaskProjector {
  constructor(
    private readonly prisma: PrismaService,
    private readonly processor: GovernanceEventProcessor,
  ) {}

  @OnEvent(DomainEventTypes.TASK_CREATED)
  async handleTaskCreated(event: DomainEvent) {
    await this.processor.process(
      event,
      DashboardTaskProjector.name,
      async () => {
        const payload = event.payload as any;
        const companyId = payload.companyId;
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const overdueTasks = await (this.prisma as any).task.count({
          where: {
            companyId,
            status: { notIn: ['COMPLETED', 'OVERDUE'] },
            dueDate: { lt: today },
          },
        });

        await (this.prisma as any).dashboardKpiSnapshot.upsert({
          where: { companyId_snapshotDate: { companyId, snapshotDate: today } },
          create: {
            companyId,
            snapshotDate: today,
            overdueTasks,
            lastProcessedEventId: event.id,
            lastProcessedCorrelationId: event.correlationId,
          },
          update: {
            overdueTasks,
            lastProcessedEventId: event.id,
            lastProcessedCorrelationId: event.correlationId,
            lastProjectionUpdate: new Date(),
          },
        });
      },
    );
  }

  @OnEvent(DomainEventTypes.TASK_COMPLETED)
  async handleTaskCompleted(event: DomainEvent) {
    await this.processor.process(
      event,
      DashboardTaskProjector.name,
      async () => {
        const payload = event.payload as any;
        const companyId = payload.companyId;
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const overdueTasks = await (this.prisma as any).task.count({
          where: {
            companyId,
            status: { notIn: ['COMPLETED', 'OVERDUE'] },
            dueDate: { lt: today },
          },
        });

        await (this.prisma as any).dashboardKpiSnapshot.upsert({
          where: { companyId_snapshotDate: { companyId, snapshotDate: today } },
          create: {
            companyId,
            snapshotDate: today,
            overdueTasks,
            lastProcessedEventId: event.id,
            lastProcessedCorrelationId: event.correlationId,
          },
          update: {
            overdueTasks,
            lastProcessedEventId: event.id,
            lastProcessedCorrelationId: event.correlationId,
            lastProjectionUpdate: new Date(),
          },
        });
      },
    );
  }
}
