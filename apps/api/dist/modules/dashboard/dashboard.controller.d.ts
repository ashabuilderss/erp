import { DashboardService } from './dashboard.service';
import { OwnerDashboardService } from './owner-dashboard.service';
export declare class DashboardController {
    private readonly legacyService;
    private readonly ownerDashboardService;
    constructor(legacyService: DashboardService, ownerDashboardService: OwnerDashboardService);
    getOwnerMetrics(companyId: string, dateStr?: string): Promise<{
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
    getOwnerKpi(companyId: string, dateStr?: string): Promise<any>;
    getOwnerAlerts(companyId: string, limitStr?: string): Promise<any>;
    getOwnerHistory(companyId: string, daysStr?: string): Promise<any>;
}
