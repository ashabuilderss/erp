import { WarningCategory, WarningSeverity } from '@prisma/client';
export declare class IssueWarningDto {
    employeeId: string;
    category: WarningCategory;
    severity: WarningSeverity;
    reason: string;
    isSystemGenerated?: boolean;
}
