import { PerformancePeriod } from '@prisma/client';
export declare class GetLeaderboardDto {
    period: string;
    periodType: PerformancePeriod;
    limit?: number;
}
