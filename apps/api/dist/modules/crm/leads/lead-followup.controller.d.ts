import { LeadFollowUpService } from './lead-followup.service';
import { CreateLeadFollowUpDto } from './dto/create-lead-followup.dto';
export declare class LeadFollowUpController {
    private readonly followUpService;
    constructor(followUpService: LeadFollowUpService);
    create(leadId: string, companyId: string, employeeId: string | null, dto: CreateLeadFollowUpDto): Promise<{
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
    findAll(leadId: string, companyId: string): Promise<{
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
