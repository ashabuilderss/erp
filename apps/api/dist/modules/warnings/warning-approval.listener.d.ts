import { PrismaService } from '../../config/prisma.service';
import { TransitionService } from '../../common/services/transition.service';
import { ApprovalStatus } from '@prisma/client';
export declare class WarningApprovalListener {
    private readonly prisma;
    private readonly transitionService;
    private readonly logger;
    constructor(prisma: PrismaService, transitionService: TransitionService);
    processWarningApprovalOutcome(approvalId: string, status: ApprovalStatus): Promise<void>;
}
