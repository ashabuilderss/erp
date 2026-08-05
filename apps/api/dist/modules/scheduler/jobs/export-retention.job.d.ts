import { PrismaService } from '../../../config/prisma.service';
export declare class ExportRetentionJob {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    handle(): Promise<void>;
}
