import { PerformancePeriod } from '@prisma/client';
export declare class GetTrendsDto {
    employeeId?: string;
    periodType?: PerformancePeriod;
    limit?: number;
}
