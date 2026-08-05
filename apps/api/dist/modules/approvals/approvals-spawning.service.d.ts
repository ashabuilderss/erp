import { PrismaService } from '../../config/prisma.service';
import { GovernanceEventPublisher } from '../governance-events/governance-event.publisher';
export declare class ApprovalsSpawningService {
    private readonly prisma;
    private readonly eventPublisher;
    private readonly logger;
    constructor(prisma: PrismaService, eventPublisher: GovernanceEventPublisher);
    spawnRequest(companyId: string, entityType: string, entityId: string, createdById: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        createdById: string;
        entityType: string;
        status: import(".prisma/client").$Enums.ApprovalStatus;
        entityId: string;
    }>;
}
