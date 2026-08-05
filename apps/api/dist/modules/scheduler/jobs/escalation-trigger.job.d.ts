import { PrismaService } from '../../../config/prisma.service';
import { AdvisoryLockService } from '../../../common/services/advisory-lock.service';
export declare class EscalationTriggerJob {
    private prisma;
    private advisoryLock;
    private readonly logger;
    constructor(prisma: PrismaService, advisoryLock: AdvisoryLockService);
    handle(): Promise<void>;
    private runEvaluation;
    private evaluateRule;
    private createEvent;
}
