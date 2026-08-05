import { LeadStatus } from '@prisma/client';
export declare class UpdateLeadStatusDto {
    status: LeadStatus;
    lostReason?: string;
}
