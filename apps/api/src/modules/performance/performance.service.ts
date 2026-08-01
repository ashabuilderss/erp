import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  Prisma,
  PerformancePeriod,
  TrendDirection,
  TaskStatus,
} from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { GovernanceEventPublisher } from '../governance-events/governance-event.publisher';
import { DomainEventTypes } from '../governance-events/types/events';
import {
  PerformanceEngine,
  PerformanceEngineResult,
} from './performance.engine';

export interface CalculateScoreInput {
  companyId: string;
  employeeId: string;
  period: string;
  periodType: PerformancePeriod;
  calculatedById?: string;
}

export interface RateEmployeeInput {
  companyId: string;
  performanceScoreId: string;
  ratedById: string;
  score: number;
  comment?: string;
}

export interface GetTrendsInput {
  companyId: string;
  employeeId?: string;
  periodType?: PerformancePeriod;
  limit?: number;
}

export interface GetLeaderboardInput {
  companyId: string;
  period: string;
  periodType: PerformancePeriod;
  limit?: number;
}

@Injectable()
export class PerformanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: GovernanceEventPublisher,
    private readonly engine: PerformanceEngine,
  ) {}

  async calculateScore(input: CalculateScoreInput): Promise<string> {
    const { companyId, employeeId, period, periodType, calculatedById } = input;

    const taskScore = await this.computeTaskScore(
      companyId,
      employeeId,
      period,
      periodType,
    );
    const attendanceScore = await this.computeAttendanceScore(
      companyId,
      employeeId,
      period,
      periodType,
    );
    const eodScore = await this.computeEodScore(
      companyId,
      employeeId,
      period,
      periodType,
    );

    const previousScore = await this.getPreviousCompositeScore(
      companyId,
      employeeId,
      periodType,
    );
    const managerScore = 0;

    const result = this.engine.calculate({
      taskScore,
      attendanceScore,
      eodScore,
      managerScore,
      previousCompositeScore: previousScore,
    });

    const scoreId = await this.prisma.$transaction(async (tx) => {
      const created = await tx.performanceScore.create({
        data: {
          companyId,
          employeeId,
          period,
          periodType,
          taskScore: result.taskScore,
          attendanceScore: result.attendanceScore,
          eodScore: result.eodScore,
          managerScore: result.managerScore,
          compositeScore: result.compositeScore,
          trend: result.trend,
          calculatedById: calculatedById ?? null,
        },
      });

      await this.eventPublisher.publish(tx, {
        eventType: DomainEventTypes.PERFORMANCE_SCORE_CALCULATED,
        entityId: created.id,
        entityType: 'PerformanceScore',
        companyId,
        payload: {
          companyId,
          employeeId,
          period,
          periodType,
          taskScore: result.taskScore,
          attendanceScore: result.attendanceScore,
          eodScore: result.eodScore,
          managerScore: result.managerScore,
          compositeScore: result.compositeScore,
          trend: result.trend,
          scoreDelta: result.scoreDelta,
        },
      });

      return created.id;
    });

    return scoreId;
  }

  async rateEmployee(input: RateEmployeeInput): Promise<string> {
    const { companyId, performanceScoreId, ratedById, score, comment } = input;

    if (score < 1 || score > 10) {
      throw new BadRequestException('Manager rating must be between 1 and 10');
    }

    const performanceScore = await this.prisma.performanceScore.findFirst({
      where: { id: performanceScoreId, companyId },
    });
    if (!performanceScore) {
      throw new NotFoundException(
        `Performance score with ID ${performanceScoreId} not found`,
      );
    }

    const ratingId = await this.prisma.$transaction(async (tx) => {
      const rating = await tx.managerRating.create({
        data: {
          companyId,
          performanceScoreId,
          ratedById,
          score,
          comment: comment ?? null,
        },
      });

      const allRatings = await tx.managerRating.findMany({
        where: { performanceScoreId },
      });
      const avgManagerScore =
        allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length;
      const normalizedManagerScore = (avgManagerScore / 10) * 100;

      const previousScore = await this.getPreviousCompositeScore(
        companyId,
        performanceScore.employeeId,
        performanceScore.periodType,
      );

      const engineResult = this.engine.calculate({
        taskScore: performanceScore.taskScore,
        attendanceScore: performanceScore.attendanceScore,
        eodScore: performanceScore.eodScore,
        managerScore: normalizedManagerScore,
        previousCompositeScore: previousScore,
      });

      await tx.performanceScore.create({
        data: {
          companyId,
          employeeId: performanceScore.employeeId,
          period: performanceScore.period,
          periodType: performanceScore.periodType,
          taskScore: engineResult.taskScore,
          attendanceScore: engineResult.attendanceScore,
          eodScore: engineResult.eodScore,
          managerScore: engineResult.managerScore,
          compositeScore: engineResult.compositeScore,
          trend: engineResult.trend,
          calculatedById: ratedById,
        },
      });

      await this.eventPublisher.publish(tx, {
        eventType: DomainEventTypes.MANAGER_RATING_RECORDED,
        entityId: rating.id,
        entityType: 'ManagerRating',
        companyId,
        payload: {
          companyId,
          performanceScoreId,
          ratedById,
          score,
          comment: comment ?? null,
          newCompositeScore: engineResult.compositeScore,
          newTrend: engineResult.trend,
          newManagerScore: engineResult.managerScore,
          taskScore: engineResult.taskScore,
          attendanceScore: engineResult.attendanceScore,
          eodScore: engineResult.eodScore,
        },
      });

      return rating.id;
    });

    return ratingId;
  }

  async getScore(id: string, companyId: string) {
    const score = await this.prisma.performanceScore.findFirst({
      where: { id, companyId },
      include: {
        employees: { include: { users: true, departments: true } },
        managerRatings: {
          include: { employees: { include: { users: true } } },
        },
      },
    });
    if (!score)
      throw new NotFoundException(`Performance score with ID ${id} not found`);
    return score;
  }

  async getCurrentScore(
    companyId: string,
    employeeId: string,
    period: string,
    periodType: PerformancePeriod,
  ) {
    const score = await this.prisma.performanceScore.findFirst({
      where: { companyId, employeeId, period, periodType },
      orderBy: { calculatedAt: 'desc' },
      include: {
        employees: { include: { users: true, departments: true } },
        managerRatings: {
          include: { employees: { include: { users: true } } },
        },
      },
    });
    return score;
  }

  async getEmployeeScores(
    companyId: string,
    employeeId: string,
    periodType?: PerformancePeriod,
  ) {
    const where: Prisma.PerformanceScoreWhereInput = { companyId, employeeId };
    if (periodType) where.periodType = periodType;

    return this.prisma.performanceScore.findMany({
      where,
      orderBy: { calculatedAt: 'desc' },
      include: { managerRatings: true },
    });
  }

  async getHistoricalScores(
    companyId: string,
    employeeId: string,
    period: string,
    periodType: PerformancePeriod,
  ) {
    return this.prisma.performanceScore.findMany({
      where: { companyId, employeeId, period, periodType },
      orderBy: { calculatedAt: 'desc' },
      include: { managerRatings: true },
    });
  }

  async getTrends(input: GetTrendsInput) {
    const { companyId, employeeId, periodType, limit = 12 } = input;

    const where: Prisma.PerformanceTrendSnapshotWhereInput = { companyId };
    if (employeeId) where.employeeId = employeeId;
    if (periodType) where.periodType = periodType;

    return this.prisma.performanceTrendSnapshot.findMany({
      where,
      orderBy: { period: 'desc' },
      take: limit,
    });
  }

  async getLeaderboard(input: GetLeaderboardInput) {
    const { companyId, period, periodType, limit = 20 } = input;

    const latestScoresPerEmployee = await this.prisma.performanceScore.groupBy({
      by: ['employeeId'],
      where: { companyId, period, periodType },
      _max: { calculatedAt: true },
    });

    const latestScores = await Promise.all(
      latestScoresPerEmployee.map(async (group) => {
        return this.prisma.performanceScore.findFirst({
          where: {
            companyId,
            employeeId: group.employeeId,
            period,
            periodType,
            calculatedAt: group._max.calculatedAt!,
          },
          include: {
            employees: {
              include: { users: true, departments: true, designations: true },
            },
          },
        });
      }),
    );

    const sorted = latestScores
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .sort((a, b) => b.compositeScore - a.compositeScore)
      .slice(0, limit);

    return sorted.map((score, index) => ({
      rank: index + 1,
      employeeId: score.employeeId,
      employeeName: score.employees.users
        ? `${score.employees.users.firstName} ${score.employees.users.lastName}`
        : 'Unknown',
      department: score.employees.departments?.name ?? 'Unknown',
      designation: score.employees.designations?.name ?? 'Unknown',
      compositeScore: score.compositeScore,
      taskScore: score.taskScore,
      attendanceScore: score.attendanceScore,
      eodScore: score.eodScore,
      managerScore: score.managerScore,
      trend: score.trend,
    }));
  }

  async recalculateScore(
    companyId: string,
    employeeId: string,
    period: string,
    periodType: PerformancePeriod,
    calculatedById?: string,
  ) {
    return this.calculateScore({
      companyId,
      employeeId,
      period,
      periodType,
      calculatedById,
    });
  }

  async listScores(
    companyId: string,
    options: {
      page?: number;
      limit?: number;
      employeeId?: string;
      periodType?: PerformancePeriod;
      period?: string;
    },
  ) {
    const { page = 1, limit = 10, employeeId, periodType, period } = options;
    const where: Prisma.PerformanceScoreWhereInput = { companyId };
    if (employeeId) where.employeeId = employeeId;
    if (periodType) where.periodType = periodType;
    if (period) where.period = period;

    const [data, total] = await Promise.all([
      this.prisma.performanceScore.findMany({
        where,
        orderBy: { calculatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          employees: { include: { users: true, departments: true } },
        },
      }),
      this.prisma.performanceScore.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  private async computeTaskScore(
    companyId: string,
    employeeId: string,
    period: string,
    periodType: PerformancePeriod,
  ): Promise<number> {
    const periodRange = this.getPeriodRange(period, periodType);

    const tasks = await this.prisma.task.findMany({
      where: {
        companyId,
        assigneeId: employeeId,
        createdAt: { gte: periodRange.start, lt: periodRange.end },
      },
    });

    if (tasks.length === 0) return 50;

    const completedTasks = tasks.filter(
      (t) => t.status === TaskStatus.COMPLETED,
    );
    return Math.round((completedTasks.length / tasks.length) * 100);
  }

  private async computeAttendanceScore(
    companyId: string,
    employeeId: string,
    period: string,
    periodType: PerformancePeriod,
  ): Promise<number> {
    const periodRange = this.getPeriodRange(period, periodType);

    const summaries = await this.prisma.attendanceSummary.findMany({
      where: {
        companyId,
        employeeId,
        attendancePeriods: {
          startDate: { gte: periodRange.start },
          endDate: { lt: periodRange.end },
        },
      },
    });

    if (summaries.length === 0) return 50;

    const totalPayable = summaries.reduce(
      (sum, s) => sum + s.payableMinutes,
      0,
    );
    const totalLate = summaries.reduce((sum, s) => sum + s.lateMinutes, 0);
    const totalAbsent = summaries.reduce((sum, s) => sum + s.absentDays, 0);
    const totalDays = summaries.length;

    if (totalDays === 0) return 50;

    const attendanceRate = ((totalDays - totalAbsent) / totalDays) * 100;
    const punctualityRate =
      totalPayable > 0
        ? ((totalPayable - totalLate) / totalPayable) * 100
        : 100;

    return Math.round(attendanceRate * 0.6 + punctualityRate * 0.4);
  }

  private async computeEodScore(
    companyId: string,
    employeeId: string,
    period: string,
    periodType: PerformancePeriod,
  ): Promise<number> {
    const periodRange = this.getPeriodRange(period, periodType);

    const eodReports = await this.prisma.eodReport.findMany({
      where: {
        companyId,
        employeeId,
        reportDate: { gte: periodRange.start, lt: periodRange.end },
      },
    });

    if (eodReports.length === 0) return 50;

    const totalDays = this.getWorkingDaysInRange(
      periodRange.start,
      periodRange.end,
    );
    const submittedCount = eodReports.filter(
      (r) => r.status === 'SUBMITTED' || r.status === 'REVIEWED',
    ).length;

    return Math.round((submittedCount / totalDays) * 100);
  }

  private async getPreviousCompositeScore(
    companyId: string,
    employeeId: string,
    currentPeriodType: PerformancePeriod,
  ): Promise<number | null> {
    const previous = await this.prisma.performanceScore.findFirst({
      where: {
        companyId,
        employeeId,
        periodType: currentPeriodType,
      },
      orderBy: { calculatedAt: 'desc' },
    });
    return previous?.compositeScore ?? null;
  }

  private getPeriodRange(
    period: string,
    periodType: PerformancePeriod,
  ): { start: Date; end: Date } {
    const [yearStr, partStr] = period.split('-');
    const year = parseInt(yearStr, 10);

    switch (periodType) {
      case PerformancePeriod.WEEKLY: {
        const weekNum = parseInt(partStr, 10);
        const jan1 = new Date(Date.UTC(year, 0, 1));
        const dayOffset = (weekNum - 1) * 7;
        const start = new Date(jan1.getTime() + dayOffset * 86400000);
        const end = new Date(start.getTime() + 7 * 86400000);
        return { start, end };
      }
      case PerformancePeriod.MONTHLY: {
        const month = parseInt(partStr, 10) - 1;
        const start = new Date(Date.UTC(year, month, 1));
        const end = new Date(Date.UTC(year, month + 1, 1));
        return { start, end };
      }
      case PerformancePeriod.QUARTERLY: {
        const quarter = parseInt(partStr, 10);
        const startMonth = (quarter - 1) * 3;
        const start = new Date(Date.UTC(year, startMonth, 1));
        const end = new Date(Date.UTC(year, startMonth + 3, 1));
        return { start, end };
      }
      case PerformancePeriod.YEARLY: {
        const start = new Date(Date.UTC(year, 0, 1));
        const end = new Date(Date.UTC(year + 1, 0, 1));
        return { start, end };
      }
    }
  }

  private getWorkingDaysInRange(start: Date, end: Date): number {
    let count = 0;
    const current = new Date(start);
    while (current < end) {
      const day = current.getUTCDay();
      if (day !== 0 && day !== 6) count++;
      current.setUTCDate(current.getUTCDate() + 1);
    }
    return Math.max(1, count);
  }
}
