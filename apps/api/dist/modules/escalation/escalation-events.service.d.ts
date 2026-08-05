import { PrismaService } from '../../config/prisma.service';
export declare class EscalationEventsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(companyId: string, status?: string): Promise<({
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
