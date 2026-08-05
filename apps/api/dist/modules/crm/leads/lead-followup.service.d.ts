import { PrismaService } from '../../../config/prisma.service';
export interface CreateFollowUpDto {
    type: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE';
    outcome?: string;
    nextFollowUpDate?: string;
    notes: string;
}
export declare class LeadFollowUpService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    logFollowUp(leadId: string, companyId: string, userId: string, dto: CreateFollowUpDto): Promise<{
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        id: string;
        createdAt: Date;
        companyId: string;
        deletedAt: Date | null;
        description: string | null;
        action: string;
        entityType: string;
        entityId: string;
        performedById: string | null;
        beforeValues: import("@prisma/client/runtime/client").JsonValue | null;
        actorEmail: string | null;
        actorName: string | null;
        actorRole: string | null;
        ipAddress: string | null;
        requestId: string | null;
        afterValues: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    getFollowUps(leadId: string, companyId: string): Promise<{
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        id: string;
        createdAt: Date;
        companyId: string;
        deletedAt: Date | null;
        description: string | null;
        action: string;
        entityType: string;
        entityId: string;
        performedById: string | null;
        beforeValues: import("@prisma/client/runtime/client").JsonValue | null;
        actorEmail: string | null;
        actorName: string | null;
        actorRole: string | null;
        ipAddress: string | null;
        requestId: string | null;
        afterValues: import("@prisma/client/runtime/client").JsonValue | null;
    }[]>;
}
