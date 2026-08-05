import { JobPostingStatus } from '@prisma/client';
export declare class QueryJobPostingDto {
    page?: number;
    limit?: number;
    search?: string;
    status?: JobPostingStatus;
    departmentId?: string;
}
export declare class CreateJobPostingDto {
    title: string;
    departmentId: string;
    description?: string;
}
export declare class UpdateJobPostingDto {
    title?: string;
    departmentId?: string;
    description?: string;
    status?: JobPostingStatus;
}
