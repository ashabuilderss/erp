import { Injectable, Logger } from '@nestjs/common';
import { ExportSyncStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../config/prisma.service';
import { GoogleSheetsClient } from './google-sheets.client';
import { ReportsService } from '../reports.service';
import { ExportDataset } from '../engines/export-types';
import { ExportAuditService } from '../../audit/export-audit.service';

export interface SyncResult {
  configId: string;
  exportType: string;
  status: ExportSyncStatus;
  rowsSynced?: number;
  error?: string;
}

@Injectable()
export class SheetSyncService {
  private readonly logger = new Logger(SheetSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sheetsClient: GoogleSheetsClient,
    private readonly reportsService: ReportsService,
    private readonly auditService: ExportAuditService,
  ) {}

  async syncAllEnabled(): Promise<SyncResult[]> {
    const configs = await this.prisma.exportConfig.findMany({
      where: { syncEnabled: true },
      include: { companies: { select: { id: true } } },
    });

    const results: SyncResult[] = [];
    for (const config of configs) {
      const result = await this.syncConfig(config);
      results.push(result);
    }
    return results;
  }

  private async syncConfig(config: {
    id: string;
    exportType: string;
    sheetId: string | null;
    sheetName: string | null;
    companyId: string;
    companies: { id: string };
  }): Promise<SyncResult> {
    if (!config.sheetId) {
      return {
        configId: config.id,
        exportType: config.exportType,
        status: ExportSyncStatus.FAILED,
        error: 'No sheetId configured',
      };
    }

    try {
      await this.prisma.exportConfig.update({
        where: { id: config.id },
        data: { syncStatus: ExportSyncStatus.SYNCING },
      });

      const sheetExists = await this.sheetsClient.sheetExists(config.sheetId);
      if (!sheetExists) {
        throw new Error(
          `Google Sheet ${config.sheetId} not found or not accessible`,
        );
      }

      const dataset = await this.reportsService.generateDatasetForSync(
        config.exportType,
        config.companyId,
      );

      const range = config.sheetName ? `${config.sheetName}!A1` : 'Sheet1!A1';

      await this.sheetsClient.clearSheet(config.sheetId, range);

      const headerRow = dataset.headers as (string | number | boolean | null)[];
      const dataRows = dataset.rows.map(
        (row) =>
          row.map((cell) =>
            cell === null || cell === undefined ? '' : cell,
          ) as (string | number | boolean | null)[],
      );

      const result = await this.sheetsClient.appendRows(config.sheetId, range, [
        headerRow,
        ...dataRows,
      ]);

      await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.exportConfig.update({
          where: { id: config.id },
          data: {
            syncStatus: ExportSyncStatus.COMPLETED,
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

      this.logger.log(
        `Synced ${result.updatedRows} rows for ${config.exportType} to sheet ${config.sheetId}`,
      );

      return {
        configId: config.id,
        exportType: config.exportType,
        status: ExportSyncStatus.COMPLETED,
        rowsSynced: result.updatedRows,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      await this.prisma.exportConfig.update({
        where: { id: config.id },
        data: {
          syncStatus: ExportSyncStatus.FAILED,
          lastSyncError: message,
        },
      });

      this.logger.error(`Sync failed for ${config.exportType}: ${message}`);

      return {
        configId: config.id,
        exportType: config.exportType,
        status: ExportSyncStatus.FAILED,
        error: message,
      };
    }
  }
}
