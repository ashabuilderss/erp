import { ApprovalsRuntimeService } from './approvals-runtime.service';
import { ApprovalsSpawningService } from './approvals-spawning.service';
import { ActionApprovalDto, OverrideApprovalDto, CreateApprovalTemplateDto } from './dto/approvals.dto';
import { PrismaService } from '../../config/prisma.service';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';
export declare class ApprovalsController {
    private readonly runtimeService;
    private readonly spawningService;
    private readonly prisma;
    constructor(runtimeService: ApprovalsRuntimeService, spawningService: ApprovalsSpawningService, prisma: PrismaService);
    getPendingApprovals(req: AuthenticatedRequest): Promise<({
        approvalSteps: {
            id: string;
            companyId: string;
            deletedAt: Date | null;
            status: import(".prisma/client").$Enums.ApprovalStatus;
            requestId: string;
            sequence: number;
            requiredRoleId: string | null;
            requiredUserId: string | null;
            isDirectManager: boolean;
            slaDeadline: Date;
            escalationLevel: number;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        createdById: string;
        entityType: string;
        status: import(".prisma/client").$Enums.ApprovalStatus;
        entityId: string;
    })[]>;
    createTemplate(req: AuthenticatedRequest, dto: CreateApprovalTemplateDto): Promise<{
        id: string;
        createdAt: Date;
        companyId: string;
        deletedAt: Date | null;
        description: string | null;
        entityType: string;
    }>;
    approve(id: string, req: AuthenticatedRequest, dto: ActionApprovalDto): Promise<{
        success: boolean;
        message: string;
    }>;
    reject(id: string, req: AuthenticatedRequest, dto: ActionApprovalDto): Promise<{
        success: boolean;
        message: string;
    }>;
    override(id: string, req: AuthenticatedRequest, dto: OverrideApprovalDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
