import { PrismaService } from '../../config/prisma.service';
import { RedisService } from '../../config/redis.service';
import { CreateReportExportDto, QueryAnalyticsDto } from './dto';
import { ExportDataset } from './engines/export-types';
import { ExportOrchestrationService } from './export-orchestration.service';
interface OwnershipFilter {
    userRole: string;
    employeeId: string | null;
    companyId: string;
}
export declare class ReportsService {
    private prisma;
    private redis;
    private orchestration;
    private readonly logger;
    private readonly analyticsCacheTTL;
    private readonly reportCacheTTL;
    constructor(prisma: PrismaService, redis: RedisService, orchestration: ExportOrchestrationService);
    private ownershipWhere;
    private dateRangeWhere;
    private periodDateRange;
    private cacheKey;
    readonly reportCatalog: {
        key: string;
        title: string;
        description: string;
        entities: string[];
    }[];
    getCatalog(): Promise<{
        items: {
            key: string;
            title: string;
            description: string;
            entities: string[];
        }[];
    }>;
    getKPIDashboard(ownership: OwnershipFilter, dto: QueryAnalyticsDto): Promise<any>;
    getPipelineFunnel(ownership: OwnershipFilter, dto: QueryAnalyticsDto): Promise<any>;
    getTrends(ownership: OwnershipFilter, dto: QueryAnalyticsDto): Promise<any>;
    getLeaderboard(ownership: OwnershipFilter): Promise<{
        employeeId: string;
        name: string;
        employeeCode: string;
        incentivesWon: number;
        incentivesValue: number;
        commissionsPaid: number;
        commissionTotal: number;
        leadsAssigned: number;
        bookingsHandled: number;
        totalScore: number;
    }[]>;
    getExports(companyId: string, page?: number, limit?: number): Promise<{
        data: {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.ReportExportStatus;
            format: import(".prisma/client").$Enums.ExportFormat;
            title: string;
            reportKey: string;
            fileUrl: string | null;
            fileSize: number | null;
            generatedAt: Date | null;
            errorMessage: string | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    createExport(dto: CreateReportExportDto, companyId: string, generatedById: string | null): Promise<import("./dto/export.dto").ExportResultDto>;
    private generateDataset;
    generateDatasetForSync(reportKey: string, companyId: string): Promise<ExportDataset>;
    private datasetEmployees;
    private datasetAttendance;
    private datasetLeaves;
    private datasetPayroll;
    private datasetProperties;
    private datasetLeads;
    private datasetBookings;
    private datasetCommissions;
    private datasetInventory;
    private datasetLabour;
    private getAttendanceTrend;
    private getDepartmentDistribution;
}
export {};
