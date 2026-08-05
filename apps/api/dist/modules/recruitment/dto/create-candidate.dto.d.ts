import { CandidateStatus } from '@prisma/client';
export declare class QueryCandidateDto {
    page?: number;
    limit?: number;
    search?: string;
    jobPostingId?: string;
    status?: CandidateStatus;
}
export declare class CreateCandidateDto {
    jobPostingId: string;
    name: string;
    email?: string;
    phone?: string;
    resumeUrl?: string;
    notes?: string;
}
export declare class UpdateCandidateDto {
    name?: string;
    email?: string;
    phone?: string;
    resumeUrl?: string;
    status?: CandidateStatus;
    notes?: string;
}
