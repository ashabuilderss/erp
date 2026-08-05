import { EscalationEventsService } from './escalation-events.service';
export declare class EscalationEventsController {
    private readonly service;
    constructor(service: EscalationEventsService);
    findAll(status: string | undefined, companyId: string): Promise<({
        escalationRules: {
            name: string;
            triggerType: import(".prisma/client").$Enums.EscalationTriggerType;
            level: number;
        };
    } & {
        id: string;
        companyId: string;
        deletedAt: Date | null;
        entityType: string;
        status: import(".prisma/client").$Enums.EscalationEventStatus;
        entityId: string;
        notes: string | null;
        resolvedAt: Date | null;
        acknowledgedAt: Date | null;
        triggeredAt: Date;
        ruleId: string;
    })[]>;
    resolve(id: string, companyId: string): Promise<{
        id: string;
        companyId: string;
        deletedAt: Date | null;
        entityType: string;
        status: import(".prisma/client").$Enums.EscalationEventStatus;
        entityId: string;
        notes: string | null;
        resolvedAt: Date | null;
        acknowledgedAt: Date | null;
        triggeredAt: Date;
        ruleId: string;
    }>;
}
