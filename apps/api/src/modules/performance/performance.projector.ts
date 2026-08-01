import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent, PerformancePeriod, TrendDirection } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { GovernanceEventProcessor } from '../governance-events/governance-event.processor';
import { DomainEventTypes } from '../governance-events/types/events';

@Injectable()
export class PerformanceProjector {
  constructor(
    private readonly prisma: PrismaService,
    private readonly processor: GovernanceEventProcessor,
  ) {}

  @OnEvent(DomainEventTypes.PERFORMANCE_SCORE_CALCULATED)
  async handlePerformanceScoreCalculated(event: DomainEvent) {
    await this.processor.process(event, PerformanceProjector.name, async () => {
      const payload = event.payload as any;

      await this.prisma.performanceTrendSnapshot.upsert({
        where: {
          companyId_employeeId_periodType_period: {
            companyId: payload.companyId,
            employeeId: payload.employeeId,
            periodType: payload.periodType as PerformancePeriod,
            period: payload.period,
          },
        },
        create: {
          companyId: payload.companyId,
          employeeId: payload.employeeId,
          periodType: payload.periodType as PerformancePeriod,
          period: payload.period,
          compositeScore: payload.compositeScore,
          trend: payload.trend as TrendDirection,
          taskScore: payload.taskScore,
          attendanceScore: payload.attendanceScore,
          eodScore: payload.eodScore,
          managerScore: payload.managerScore,
          previousCompositeScore:
            payload.scoreDelta !== null
              ? payload.compositeScore - payload.scoreDelta
              : null,
          scoreDelta: payload.scoreDelta,
          lastProcessedEventId: event.id,
          lastProcessedCorrelationId: event.correlationId,
        },
        update: {
          compositeScore: payload.compositeScore,
          trend: payload.trend as TrendDirection,
          taskScore: payload.taskScore,
          attendanceScore: payload.attendanceScore,
          eodScore: payload.eodScore,
          managerScore: payload.managerScore,
          previousCompositeScore:
            payload.scoreDelta !== null
              ? payload.compositeScore - payload.scoreDelta
              : null,
          scoreDelta: payload.scoreDelta,
          lastProcessedEventId: event.id,
          lastProcessedCorrelationId: event.correlationId,
          lastProjectionUpdate: new Date(),
        },
      });
    });
  }

  @OnEvent(DomainEventTypes.MANAGER_RATING_RECORDED)
  async handleManagerRatingRecorded(event: DomainEvent) {
    await this.processor.process(event, PerformanceProjector.name, async () => {
      const payload = event.payload as any;

      const performanceScore = await this.prisma.performanceScore.findUnique({
        where: { id: payload.performanceScoreId },
      });

      if (!performanceScore) return;

      await this.prisma.performanceTrendSnapshot.upsert({
        where: {
          companyId_employeeId_periodType_period: {
            companyId: payload.companyId,
            employeeId: performanceScore.employeeId,
            periodType: performanceScore.periodType,
            period: performanceScore.period,
          },
        },
        create: {
          companyId: payload.companyId,
          employeeId: performanceScore.employeeId,
          periodType: performanceScore.periodType,
          period: performanceScore.period,
          compositeScore: payload.newCompositeScore,
          trend: payload.newTrend as TrendDirection,
          taskScore: payload.taskScore,
          attendanceScore: payload.attendanceScore,
          eodScore: payload.eodScore,
          managerScore: payload.newManagerScore,
          lastProcessedEventId: event.id,
          lastProcessedCorrelationId: event.correlationId,
        },
        update: {
          compositeScore: payload.newCompositeScore,
          trend: payload.newTrend as TrendDirection,
          taskScore: payload.taskScore,
          attendanceScore: payload.attendanceScore,
          eodScore: payload.eodScore,
          managerScore: payload.newManagerScore,
          lastProcessedEventId: event.id,
          lastProcessedCorrelationId: event.correlationId,
          lastProjectionUpdate: new Date(),
        },
      });
    });
  }
}
