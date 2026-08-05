import { PrismaService } from '../../config/prisma.service';
import { TransitionService } from '../../common/services/transition.service';
import { ApprovalStatus } from '@prisma/client';
import { ApprovalsSpawningService } from '../approvals';
import { ReleaseHoldDto } from './dto/payroll-holds.dto';
export declare class HoldReleaseService {
    private readonly prisma;
    private readonly spawningService;
    private readonly transitionService;
    private readonly logger;
    constructor(prisma: PrismaService, spawningService: ApprovalsSpawningService, transitionService: TransitionService);
    requestRelease(companyId: string, holdId: string, actorUserId: string, dto: ReleaseHoldDto): Promise<{
        status: string;
    }>;
    processReleaseOutcome(approvalId: string, status: ApprovalStatus): Promise<void>;
}
