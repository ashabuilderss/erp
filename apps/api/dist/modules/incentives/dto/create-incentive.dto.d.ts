import { IncentiveStatus, PayoutStatus } from '@prisma/client';
export declare class CreateIncentiveDto {
    title: string;
    description: string;
    award: string;
    value?: number;
    opportunityLabel?: string;
    opportunityType?: string;
    status?: IncentiveStatus;
    winnerId?: string;
    payoutStatus?: PayoutStatus;
}
