import { PrismaService } from '../../../config/prisma.service';
export declare class AttendanceSelfieCleanupJob {
    private prisma;
    private readonly logger;
    private readonly RETENTION_DAYS;
    constructor(prisma: PrismaService);
    handle(): Promise<void>;
}
