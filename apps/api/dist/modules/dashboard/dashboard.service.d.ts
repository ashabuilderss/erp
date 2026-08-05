import { PrismaService } from '../../config/prisma.service';
export declare class DashboardService {
    private prisma;
    constructor(prisma: PrismaService);
    getMetricsSnapshot(companyId: string, dateStr?: string): Promise<{
        id: string;
        companyId: string;
        deletedAt: Date | null;
        projectionVersion: number;
        lastProcessedEventId: string | null;
        lastProcessedCorrelationId: string | null;
        rebuiltAt: Date | null;
        lastProjectionUpdate: Date;
        snapshotDate: Date;
        presentEmployees: number;
        absentEmployees: number;
        lateEmployees: number;
        totalEmployees: number;
        activeWarnings: number;
        activePayrollHolds: number;
        pendingApprovals: number;
        overdueTasks: number;
    } | {
        companyId: string;
        snapshotDate: Date;
        totalEmployees: number;
        presentEmployees: number;
        absentEmployees: number;
        lateEmployees: number;
        pendingApprovals: number;
        overdueTasks: number;
        activeWarnings: number;
        activePayrollHolds: number;
    }>;
}
