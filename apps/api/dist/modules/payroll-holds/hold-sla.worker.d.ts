import { PrismaService } from '../../config/prisma.service';
import { ApprovalsRuntimeService } from '../approvals/approvals-runtime.service';
export declare class HoldSlaWorker {
    private readonly prisma;
    private readonly approvalsService;
    private readonly logger;
    constructor(prisma: PrismaService, approvalsService: ApprovalsRuntimeService);
    handleSlaEscalations(): Promise<void>;
}
