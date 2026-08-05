import { PrismaService } from '../../config/prisma.service';
export declare class OwnerDashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getKpiSnapshot(companyId: string, dateStr?: string): Promise<any>;
    getRecentAlerts(companyId: string, limit?: number): Promise<any>;
    getSnapshotHistory(companyId: string, days?: number): Promise<any>;
    private getEmptySnapshot;
}
