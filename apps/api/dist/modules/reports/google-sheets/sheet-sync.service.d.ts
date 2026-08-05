import { ExportSyncStatus } from '@prisma/client';
import { PrismaService } from '../../../config/prisma.service';
import { GoogleSheetsClient } from './google-sheets.client';
import { ReportsService } from '../reports.service';
import { ExportAuditService } from '../../audit/export-audit.service';
export interface SyncResult {
    configId: string;
    exportType: string;
    status: ExportSyncStatus;
    rowsSynced?: number;
    error?: string;
}
export declare class SheetSyncService {
    private readonly prisma;
    private readonly sheetsClient;
    private readonly reportsService;
    private readonly auditService;
    private readonly logger;
    constructor(prisma: PrismaService, sheetsClient: GoogleSheetsClient, reportsService: ReportsService, auditService: ExportAuditService);
    syncAllEnabled(): Promise<SyncResult[]>;
    private syncConfig;
}
