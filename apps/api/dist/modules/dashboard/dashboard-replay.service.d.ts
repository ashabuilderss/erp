import { PrismaService } from '../../config/prisma.service';
export declare class DashboardReplayService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    rebuildSnapshot(companyId: string, dateStr?: string): Promise<any>;
}
