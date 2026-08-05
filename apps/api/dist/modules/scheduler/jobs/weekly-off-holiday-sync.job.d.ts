import { PrismaService } from '../../../config/prisma.service';
export declare class WeeklyOffHolidaySyncJob {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    handle(): Promise<void>;
}
