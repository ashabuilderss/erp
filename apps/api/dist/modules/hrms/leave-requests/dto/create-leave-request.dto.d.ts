import { LeaveType } from '@prisma/client';
export declare class CreateLeaveRequestDto {
    employeeId: string;
    startDate: string;
    endDate: string;
    type: LeaveType;
    reason?: string;
    documentUrl?: string;
}
