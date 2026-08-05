import { LeaveType } from '@prisma/client';
export declare class QueryLeaveAllocationDto {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    leaveType?: LeaveType;
    year?: number;
    employeeId?: string;
}
