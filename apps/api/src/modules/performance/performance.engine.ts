import { Injectable } from '@nestjs/common';
import { TrendDirection } from '@prisma/client';

export interface PerformanceEngineInput {
  taskScore: number;
  attendanceScore: number;
  eodScore: number;
  managerScore: number;
  previousCompositeScore?: number | null;
}

export interface PerformanceEngineResult {
  taskScore: number;
  attendanceScore: number;
  eodScore: number;
  managerScore: number;
  compositeScore: number;
  trend: TrendDirection;
  scoreDelta: number | null;
}

const WEIGHTS = {
  task: 0.3,
  attendance: 0.25,
  eod: 0.2,
  manager: 0.25,
} as const;

const SCORE_MIN = 0;
const SCORE_MAX = 100;

const TREND_IMPROVING_THRESHOLD = 2;
const TREND_DECLINING_THRESHOLD = -2;

@Injectable()
export class PerformanceEngine {
  calculate(input: PerformanceEngineInput): PerformanceEngineResult {
    const taskScore = this.clampScore(input.taskScore);
    const attendanceScore = this.clampScore(input.attendanceScore);
    const eodScore = this.clampScore(input.eodScore);
    const managerScore = this.clampScore(input.managerScore);

    const compositeScore = this.computeWeightedComposite(
      taskScore,
      attendanceScore,
      eodScore,
      managerScore,
    );

    const previousScore = input.previousCompositeScore ?? null;
    const scoreDelta =
      previousScore !== null
        ? Math.round((compositeScore - previousScore) * 100) / 100
        : null;

    const trend = this.computeTrend(scoreDelta);

    return {
      taskScore,
      attendanceScore,
      eodScore,
      managerScore,
      compositeScore,
      trend,
      scoreDelta,
    };
  }

  private computeWeightedComposite(
    taskScore: number,
    attendanceScore: number,
    eodScore: number,
    managerScore: number,
  ): number {
    const raw =
      taskScore * WEIGHTS.task +
      attendanceScore * WEIGHTS.attendance +
      eodScore * WEIGHTS.eod +
      managerScore * WEIGHTS.manager;

    return Math.round(raw * 100) / 100;
  }

  private computeTrend(scoreDelta: number | null): TrendDirection {
    if (scoreDelta === null) return TrendDirection.STABLE;
    if (scoreDelta > TREND_IMPROVING_THRESHOLD) return TrendDirection.IMPROVING;
    if (scoreDelta < TREND_DECLINING_THRESHOLD) return TrendDirection.DECLINING;
    return TrendDirection.STABLE;
  }

  private clampScore(score: number): number {
    if (Number.isNaN(score) || score === null || score === undefined) {
      return SCORE_MIN;
    }
    return Math.max(
      SCORE_MIN,
      Math.min(SCORE_MAX, Math.round(score * 100) / 100),
    );
  }
}
