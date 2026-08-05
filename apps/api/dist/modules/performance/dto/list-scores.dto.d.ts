import { PerformancePeriod } from '@prisma/client';
export declare class ListScoresDto {
    page?: number;
    limit?: number;
    employeeId?: string;
    periodType?: PerformancePeriod;
    period?: string;
}
