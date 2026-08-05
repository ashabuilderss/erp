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
var SheetSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SheetSyncService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../config/prisma.service");
const google_sheets_client_1 = require("./google-sheets.client");
const reports_service_1 = require("../reports.service");
const export_audit_service_1 = require("../../audit/export-audit.service");
let SheetSyncService = SheetSyncService_1 = class SheetSyncService {
    prisma;
    sheetsClient;
    reportsService;
    auditService;
    logger = new common_1.Logger(SheetSyncService_1.name);
    constructor(prisma, sheetsClient, reportsService, auditService) {
        this.prisma = prisma;
        this.sheetsClient = sheetsClient;
        this.reportsService = reportsService;
        this.auditService = auditService;
    }
    async syncAllEnabled() {
        const configs = await this.prisma.exportConfig.findMany({
            where: { syncEnabled: true },
            include: { companies: { select: { id: true } } },
        });
        const results = [];
        for (const config of configs) {
            const result = await this.syncConfig(config);
            results.push(result);
        }
        return results;
    }
    async syncConfig(config) {
        if (!config.sheetId) {
            return {
                configId: config.id,
                exportType: config.exportType,
                status: client_1.ExportSyncStatus.FAILED,
                error: 'No sheetId configured',
            };
        }
        try {
            await this.prisma.exportConfig.update({
                where: { id: config.id },
                data: { syncStatus: client_1.ExportSyncStatus.SYNCING },
            });
            const sheetExists = await this.sheetsClient.sheetExists(config.sheetId);
            if (!sheetExists) {
                throw new Error(`Google Sheet ${config.sheetId} not found or not accessible`);
            }
            const dataset = await this.reportsService.generateDatasetForSync(config.exportType, config.companyId);
            const range = config.sheetName ? `${config.sheetName}!A1` : 'Sheet1!A1';
            await this.sheetsClient.clearSheet(config.sheetId, range);
            const headerRow = dataset.headers;
            const dataRows = dataset.rows.map((row) => row.map((cell) => cell === null || cell === undefined ? '' : cell));
            const result = await this.sheetsClient.appendRows(config.sheetId, range, [
                headerRow,
                ...dataRows,
            ]);
            await this.prisma.$transaction(async (tx) => {
                await tx.exportConfig.update({
                    where: { id: config.id },
                    data: {
                        syncStatus: client_1.ExportSyncStatus.COMPLETED,
                        lastSyncedAt: new Date(),
                        lastSyncError: null,
                    },
                });
                await this.auditService.logExport({
                    tx,
                    companyId: config.companyId,
                    exportConfigId: config.id,
                    exportType: config.exportType,
                    format: 'SHEET',
                    requestedById: 'system',
                    rowCount: dataset.rows.length,
                    isSensitive: false,
                });
            });
            this.logger.log(`Synced ${result.updatedRows} rows for ${config.exportType} to sheet ${config.sheetId}`);
            return {
                configId: config.id,
                exportType: config.exportType,
                status: client_1.ExportSyncStatus.COMPLETED,
                rowsSynced: result.updatedRows,
            };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            await this.prisma.exportConfig.update({
                where: { id: config.id },
                data: {
                    syncStatus: client_1.ExportSyncStatus.FAILED,
                    lastSyncError: message,
                },
            });
            this.logger.error(`Sync failed for ${config.exportType}: ${message}`);
            return {
                configId: config.id,
                exportType: config.exportType,
                status: client_1.ExportSyncStatus.FAILED,
                error: message,
            };
        }
    }
};
exports.SheetSyncService = SheetSyncService;
exports.SheetSyncService = SheetSyncService = SheetSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        google_sheets_client_1.GoogleSheetsClient,
        reports_service_1.ReportsService,
        export_audit_service_1.ExportAuditService])
], SheetSyncService);
//# sourceMappingURL=sheet-sync.service.js.map