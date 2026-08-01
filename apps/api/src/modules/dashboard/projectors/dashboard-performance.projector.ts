import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent } from '@prisma/client';
import { PrismaService } from '../../../config/prisma.service';
import { GovernanceEventProcessor } from '../../governance-events/governance-event.processor';
import { DomainEventTypes } from '../../governance-events/types/events';

@Injectable()
export class DashboardPerformanceProjector {
  constructor(
    private readonly prisma: PrismaService,
    private readonly processor: GovernanceEventProcessor,
  ) {}

  @OnEvent(DomainEventTypes.PERFORMANCE_SCORE_CALCULATED)
  async handlePerformanceScoreCalculated(event: DomainEvent) {
    await this.processor.process(
      event,
      DashboardPerformanceProjector.name,
      async () => {
        const payload = event.payload as any;
        const companyId = payload.companyId;
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const avgResult = await (this.prisma as any).performanceScore.aggregate(
          {
            where: { companyId },
            _avg: { compositeScore: true },
          },
        );

        const avgPerformanceScore = avgResult._avg?.compositeScore ?? 0;

        const topPerformers = await (
          this.prisma as any
        ).performanceScore.findMany({
          where: { companyId },
          orderBy: { compositeScore: 'desc' },
          take: 5,
          select: { employeeId: true, compositeScore: true, period: true },
        });

        await (this.prisma as any).dashboardKpiSnapshot.upsert({
          where: { companyId_snapshotDate: { companyId, snapshotDate: today } },
          create: {
            companyId,
            snapshotDate: today,
            avgPerformanceScore,
            topPerformers: topPerformers,
            lastProcessedEventId: event.id,
            lastProcessedCorrelationId: event.correlationId,
          },
          update: {
            avgPerformanceScore,
            topPerformers: topPerformers,
            lastProcessedEventId: event.id,
            lastProcessedCorrelationId: event.correlationId,
            lastProjectionUpdate: new Date(),
          },
        });
      },
    );
  }

  @OnEvent(DomainEventTypes.MANAGER_RATING_RECORDED)
  async handleManagerRatingRecorded(event: DomainEvent) {
    await this.processor.process(
      event,
      DashboardPerformanceProjector.name,
      async () => {
        const payload = event.payload as any;
        const companyId = payload.companyId;
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const avgResult = await (this.prisma as any).performanceScore.aggregate(
          {
            where: { companyId },
            _avg: { compositeScore: true },
          },
        );

        const avgPerformanceScore = avgResult._avg?.compositeScore ?? 0;

        const topPerformers = await (
          this.prisma as any
        ).performanceScore.findMany({
          where: { companyId },
          orderBy: { compositeScore: 'desc' },
          take: 5,
          select: { employeeId: true, compositeScore: true, period: true },
        });

        await (this.prisma as any).dashboardKpiSnapshot.upsert({
          where: { companyId_snapshotDate: { companyId, snapshotDate: today } },
          create: {
            companyId,
            snapshotDate: today,
            avgPerformanceScore,
            topPerformers: topPerformers,
            lastProcessedEventId: event.id,
            lastProcessedCorrelationId: event.correlationId,
          },
          update: {
            avgPerformanceScore,
            topPerformers: topPerformers,
            lastProcessedEventId: event.id,
            lastProcessedCorrelationId: event.correlationId,
            lastProjectionUpdate: new Date(),
          },
        });
      },
    );
  }
}
