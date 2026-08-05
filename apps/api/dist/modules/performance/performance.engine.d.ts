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
export declare class PerformanceEngine {
    calculate(input: PerformanceEngineInput): PerformanceEngineResult;
    private computeWeightedComposite;
    private computeTrend;
    private clampScore;
}
