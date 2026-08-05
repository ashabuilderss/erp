import { LeaveStatus, LeaveType } from '@prisma/client';
export declare class QueryLeaveRequestDto {
    page?: number;
    limit?: number;
    employeeId?: string;
    status?: LeaveStatus;
    type?: LeaveType;
    startDateFrom?: string;
    endDateTo?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
