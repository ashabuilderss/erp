import { PrismaService } from '../../config/prisma.service';
export declare class SoftDeleteService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    enforceDeletionGovernance(companyId: string, entityType: string, entityId: string, deletedById: string, reason: string, userRole: string): Promise<void>;
}
