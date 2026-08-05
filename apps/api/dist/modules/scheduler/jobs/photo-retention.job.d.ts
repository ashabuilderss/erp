import { PrismaService } from '../../../config/prisma.service';
export declare class PhotoRetentionJob {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    handle(): Promise<void>;
}
