import { PrismaService } from '../../config/prisma.service';
import { TransitionService } from '../../common/services/transition.service';
import { SubmitProofDto, ReviewProofDto } from './dto/tasks.dto';
import { GovernanceEventPublisher } from '../governance-events/governance-event.publisher';
export declare class TaskProofService {
    private readonly prisma;
    private readonly transitionService;
    private readonly eventPublisher?;
    private readonly logger;
    constructor(prisma: PrismaService, transitionService: TransitionService, eventPublisher?: GovernanceEventPublisher | undefined);
    submitProof(companyId: string, taskId: string, actorId: string, dto: SubmitProofDto): Promise<{
        comments: string | null;
        id: string;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.ApprovalStatus;
        reviewedAt: Date | null;
        taskId: string;
        submissionUrl: string;
        submittedAt: Date;
        reviewerId: string | null;
        reviewerComments: string | null;
    }>;
    acknowledgeCompletion(companyId: string, proofId: string, actorId: string, dto: ReviewProofDto): Promise<{
        success: boolean;
        message: string;
    }>;
    approveCompletion(companyId: string, proofId: string, actorId: string, dto: ReviewProofDto): Promise<{
        success: boolean;
        message: string;
    }>;
    rejectCompletion(companyId: string, proofId: string, actorId: string, dto: ReviewProofDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
