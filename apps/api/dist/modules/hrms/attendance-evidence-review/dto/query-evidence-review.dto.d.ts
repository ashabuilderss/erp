import { EvidenceReviewStatus } from '@prisma/client';
export declare class QueryEvidenceReviewDto {
    page?: string;
    limit?: string;
    status?: EvidenceReviewStatus;
}
