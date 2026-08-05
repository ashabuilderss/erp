import { ReportsService } from './reports.service';
import { ExportOrchestrationService } from './export-orchestration.service';
import { CreateReportExportDto, QueryReportExportDto, QueryAnalyticsDto } from './dto';
export declare class ReportsController {
    private readonly service;
    private readonly orchestration;
    constructor(service: ReportsService, orchestration: ExportOrchestrationService);
    getCatalog(): Promise<{
        items: {
            key: string;
            title: string;
            description: string;
            entities: string[];
        }[];
    }>;
    getKPIDashboard(dto: QueryAnalyticsDto, companyId: string, userRole: string, employeeId: string | null): Promise<any>;
    getPipelineFunnel(dto: QueryAnalyticsDto, companyId: string, userRole: string, employeeId: string | null): Promise<any>;
    getTrends(dto: QueryAnalyticsDto, companyId: string, userRole: string, employeeId: string | null): Promise<any>;
    getLeaderboard(companyId: string, userRole: string, employeeId: string | null): Promise<{
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
    getExports(query: QueryReportExportDto, companyId: string): Promise<{
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
    getExportHistory(query: QueryReportExportDto, companyId: string): Promise<{
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
    createExport(dto: CreateReportExportDto, companyId: string, userId: string, userRole: string, generatedById: string | null): Promise<import("./dto/export.dto").ExportResultDto>;
}
