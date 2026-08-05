import { PayrollHoldSource, PayrollHoldType } from '@prisma/client';
export declare class RecommendHoldDto {
    employeeId: string;
    source: PayrollHoldSource;
    sourceId?: string;
    holdType: PayrollHoldType;
    amount?: number;
    reason: string;
    evidenceUri?: string;
}
export declare class CreateEmergencyHoldDto {
    employeeId: string;
    holdType: PayrollHoldType;
    amount?: number;
    reason: string;
}
export declare class ReleaseHoldDto {
    reason: string;
}
