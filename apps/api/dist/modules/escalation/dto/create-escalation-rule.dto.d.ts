import { EscalationTriggerType } from '@prisma/client';
export declare class CreateEscalationRuleDto {
    name: string;
    triggerType: EscalationTriggerType;
    config: Record<string, unknown>;
    level: number;
    notifyRoles: string[];
    isActive?: boolean;
}
export declare class UpdateEscalationRuleDto {
    name?: string;
    triggerType?: EscalationTriggerType;
    config?: Record<string, unknown>;
    level?: number;
    notifyRoles?: string[];
    isActive?: boolean;
}
