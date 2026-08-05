import { PrismaService } from '../../config/prisma.service';
import { CreateExtensionDto } from './dto/tasks.dto';
import { ApprovalsSpawningService } from '../approvals';
import { ApprovalStatus } from '@prisma/client';
export declare class TaskExtensionService {
    private readonly prisma;
    private readonly spawningService;
    private readonly logger;
    constructor(prisma: PrismaService, spawningService: ApprovalsSpawningService);
    requestExtension(companyId: string, taskId: string, actorId: string, dto: CreateExtensionDto): Promise<{
        id: string;
        createdAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.ApprovalStatus;
        reason: string;
        approvalId: string | null;
        taskId: string;
        requestedDueDate: Date;
    }>;
    processExtensionOutcome(approvalId: string, status: ApprovalStatus): Promise<void>;
}
