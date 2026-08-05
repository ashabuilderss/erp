import { PrismaService } from '../../config/prisma.service';
import { RecommendHoldDto } from './dto/payroll-holds.dto';
import { ApprovalsSpawningService } from '../approvals';
export declare class HoldRecommendationService {
    private readonly prisma;
    private readonly spawningService;
    private readonly logger;
    constructor(prisma: PrismaService, spawningService: ApprovalsSpawningService);
    createRecommendation(companyId: string, createdByUserId: string | null, dto: RecommendHoldDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        createdById: string | null;
        status: import(".prisma/client").$Enums.PayrollHoldStatus;
        reason: string;
        approvalId: string | null;
        employeeId: string;
        source: import(".prisma/client").$Enums.PayrollHoldSource;
        amount: import("@prisma/client-runtime-utils").Decimal | null;
        sourceId: string | null;
        holdType: import(".prisma/client").$Enums.PayrollHoldType;
        evidenceUri: string | null;
    }>;
}
