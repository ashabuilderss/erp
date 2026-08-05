export declare class ActionApprovalDto {
    comments?: string;
}
export declare class OverrideApprovalDto {
    reason: string;
}
export declare class CreateApprovalTemplateStepDto {
    requiredRoleId?: string;
    requiredUserId?: string;
    isDirectManager?: boolean;
    slaHours?: number;
}
export declare class CreateApprovalTemplateDto {
    entityType: string;
    description?: string;
    steps: CreateApprovalTemplateStepDto[];
}
