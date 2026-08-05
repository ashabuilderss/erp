import { LeaveType } from '@prisma/client';
export declare class CreateLeaveAllocationDto {
    employeeId: string;
    year: number;
    leaveType: LeaveType;
    totalDays: number;
}
