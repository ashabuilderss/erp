import { ExportFormat } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { ExportDataset } from './engines/export-types';
import { CsvExportEngine } from './engines/csv-export.engine';
import { ExcelExportEngine } from './engines/excel-export.engine';
import { PdfExportEngine } from './engines/pdf-export.engine';
import { ExportPolicyEngine } from './export-policy.engine';
import { ExportAuditService } from '../audit/export-audit.service';
import { ExportResultDto } from './dto/export.dto';
export declare class ExportOrchestrationService {
    private readonly prisma;
    private readonly csvEngine;
    private readonly excelEngine;
    private readonly pdfEngine;
    private readonly policyEngine;
    private readonly auditService;
    private readonly logger;
    private readonly engines;
    constructor(prisma: PrismaService, csvEngine: CsvExportEngine, excelEngine: ExcelExportEngine, pdfEngine: PdfExportEngine, policyEngine: ExportPolicyEngine, auditService: ExportAuditService);
    createExport(params: {
        companyId: string;
        userId: string;
        userRole: string;
        reportKey: string;
        format: ExportFormat;
        dataset: ExportDataset;
    }): Promise<ExportResultDto>;
    getExportHistory(companyId: string, page?: number, limit?: number): Promise<{
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
}
