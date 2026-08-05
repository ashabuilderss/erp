import { PerformancePeriod } from '@prisma/client';
export declare class CalculateScoreDto {
    employeeId: string;
    period: string;
    periodType: PerformancePeriod;
    calculatedById?: string;
}
