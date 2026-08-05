import { PrismaService } from '../../config/prisma.service';
import { GovernanceEventPublisher } from '../governance-events/governance-event.publisher';
export declare class ApprovalsRuntimeService {
    private readonly prisma;
    private readonly eventPublisher;
    private readonly logger;
    constructor(prisma: PrismaService, eventPublisher: GovernanceEventPublisher);
    private verifyDelegation;
    approveStep(requestId: string, userId: string, comments?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    rejectStep(requestId: string, userId: string, comments?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    overrideRequest(requestId: string, userId: string, reason: string): Promise<{
        success: boolean;
        message: string;
    }>;
    escalateRequest(requestId: string): Promise<void>;
}
