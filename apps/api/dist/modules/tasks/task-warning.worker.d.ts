import { PrismaService } from '../../config/prisma.service';
export declare class TaskWarningWorker {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    handlePendingTaskWarnings(): Promise<void>;
}
