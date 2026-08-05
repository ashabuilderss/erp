import { EvidenceReviewStatus } from '@prisma/client';
export declare class ReviewEvidenceDto {
    status: EvidenceReviewStatus;
    remarks?: string;
}
