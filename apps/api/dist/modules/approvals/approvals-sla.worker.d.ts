import { PrismaService } from '../../config/prisma.service';
export declare class ApprovalsSlaWorker {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    handleSlaBreaches(): Promise<void>;
}
