import { EodReportStatus } from '@prisma/client';
export declare class CreateEodReportDto {
    reportDate: string;
    accomplishments: string;
    challenges?: string;
    tomorrowPlan?: string;
    photoUrls?: string[];
}
export declare class UpdateEodReportDto {
    accomplishments?: string;
    challenges?: string;
    tomorrowPlan?: string;
    status?: EodReportStatus;
    reviewedById?: string;
}
