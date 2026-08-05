import { EscalationRulesService } from './escalation-rules.service';
import { CreateEscalationRuleDto, UpdateEscalationRuleDto } from './dto/create-escalation-rule.dto';
export declare class EscalationRulesController {
    private readonly service;
    constructor(service: EscalationRulesService);
    findAll(companyId: string): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        triggerType: import(".prisma/client").$Enums.EscalationTriggerType;
        config: import("@prisma/client/runtime/client").JsonValue;
        level: number;
        notifyRoles: string[];
    }[]>;
    create(dto: CreateEscalationRuleDto, companyId: string): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        triggerType: import(".prisma/client").$Enums.EscalationTriggerType;
        config: import("@prisma/client/runtime/client").JsonValue;
        level: number;
        notifyRoles: string[];
    }>;
    update(id: string, dto: UpdateEscalationRuleDto, companyId: string): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        triggerType: import(".prisma/client").$Enums.EscalationTriggerType;
        config: import("@prisma/client/runtime/client").JsonValue;
        level: number;
        notifyRoles: string[];
    }>;
    remove(id: string, companyId: string): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        triggerType: import(".prisma/client").$Enums.EscalationTriggerType;
        config: import("@prisma/client/runtime/client").JsonValue;
        level: number;
        notifyRoles: string[];
    }>;
}
