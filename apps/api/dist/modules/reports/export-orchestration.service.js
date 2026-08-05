"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ExportOrchestrationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportOrchestrationService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../config/prisma.service");
const csv_export_engine_1 = require("./engines/csv-export.engine");
const excel_export_engine_1 = require("./engines/excel-export.engine");
const pdf_export_engine_1 = require("./engines/pdf-export.engine");
const export_policy_engine_1 = require("./export-policy.engine");
const export_audit_service_1 = require("../audit/export-audit.service");
let ExportOrchestrationService = ExportOrchestrationService_1 = class ExportOrchestrationService {
    prisma;
    csvEngine;
    excelEngine;
    pdfEngine;
    policyEngine;
    auditService;
    logger = new common_1.Logger(ExportOrchestrationService_1.name);
    engines = new Map();
    constructor(prisma, csvEngine, excelEngine, pdfEngine, policyEngine, auditService) {
        this.prisma = prisma;
        this.csvEngine = csvEngine;
        this.excelEngine = excelEngine;
        this.pdfEngine = pdfEngine;
        this.policyEngine = policyEngine;
        this.auditService = auditService;
        this.engines.set(client_1.ExportFormat.CSV, this.csvEngine);
        this.engines.set(client_1.ExportFormat.EXCEL, this.excelEngine);
        this.engines.set(client_1.ExportFormat.PDF, this.pdfEngine);
    }
    async createExport(params) {
        const { companyId, userId, userRole, reportKey, format, dataset } = params;
        const engine = this.engines.get(format);
        if (!engine) {
            throw new common_1.BadRequestException(`Unsupported export format: ${format}`);
        }
        const exportRec = await this.prisma.reportExport.create({
            data: {
                companyId,
                reportKey,
                title: dataset.title,
                format,
                status: client_1.ReportExportStatus.PROCESSING,
                filters: {},
                generatedById: userId,
            },
        });
        try {
            await this.policyEngine.evaluateAndLog({
                companyId,
                userId,
                userRole,
                dataset: reportKey,
                format: format,
                rowCount: dataset.rows.length,
            });
            const buffer = await engine.generate(dataset);
            const fileUrl = `reports/${companyId}/${exportRec.id}.${engine.fileExtension}`;
            await this.prisma.$transaction(async (tx) => {
                await tx.reportExport.update({
                    where: { id: exportRec.id },
                    data: {
                        status: client_1.ReportExportStatus.COMPLETED,
                        fileUrl,
                        fileSize: buffer.length,
                        generatedAt: new Date(),
                    },
                });
                const exportLogId = await this.auditService.logExport({
                    tx,
                    companyId,
                    exportType: reportKey,
                    format,
                    requestedById: userId,
                    rowCount: dataset.rows.length,
                    isSensitive: ['payroll', 'commissions', 'employees'].includes(reportKey),
                });
                await this.auditService.logDownload({
                    tx,
                    companyId,
                    exportLogId,
                    userId,
                    fileName: `${reportKey}.${engine.fileExtension}`,
                });
            });
            return {
                id: exportRec.id,
                title: dataset.title,
                format,
                status: client_1.ReportExportStatus.COMPLETED,
                fileUrl,
                bufferBase64: buffer.toString('base64'),
                mimeType: engine.mimeType,
                fileExtension: engine.fileExtension,
                summary: `Generated ${format} export for ${dataset.title} with ${dataset.rows.length} rows`,
                createdAt: exportRec.createdAt,
            };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            await this.prisma.reportExport.update({
                where: { id: exportRec.id },
                data: {
                    status: client_1.ReportExportStatus.FAILED,
                    errorMessage: message,
                    failedAt: new Date(),
                },
            });
            throw new common_1.BadRequestException(`Export failed: ${message}`);
        }
    }
    async getExportHistory(companyId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.reportExport.findMany({
                where: { companyId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    reportKey: true,
                    title: true,
                    format: true,
                    status: true,
                    fileUrl: true,
                    fileSize: true,
                    errorMessage: true,
                    createdAt: true,
                    generatedAt: true,
                },
            }),
            this.prisma.reportExport.count({ where: { companyId } }),
        ]);
        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
};
exports.ExportOrchestrationService = ExportOrchestrationService;
exports.ExportOrchestrationService = ExportOrchestrationService = ExportOrchestrationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        csv_export_engine_1.CsvExportEngine,
        excel_export_engine_1.ExcelExportEngine,
        pdf_export_engine_1.PdfExportEngine,
        export_policy_engine_1.ExportPolicyEngine,
        export_audit_service_1.ExportAuditService])
], ExportOrchestrationService);
//# sourceMappingURL=export-orchestration.service.js.map