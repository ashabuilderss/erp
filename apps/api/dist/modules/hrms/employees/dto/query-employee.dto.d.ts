import { EmployeeStatus } from '@prisma/client';
export declare class QueryEmployeeDto {
    page?: number;
    limit?: number;
    search?: string;
    departmentId?: string;
    designationId?: string;
    status?: EmployeeStatus;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
