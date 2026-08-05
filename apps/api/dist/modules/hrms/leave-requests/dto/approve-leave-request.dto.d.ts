import { LeaveStatus } from '@prisma/client';
export declare class ApproveLeaveRequestDto {
    status: LeaveStatus;
    reason?: string;
}
