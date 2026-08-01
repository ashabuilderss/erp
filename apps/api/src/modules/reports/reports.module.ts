import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { ExportPolicyEngine } from './export-policy.engine';
import { ExportOrchestrationService } from './export-orchestration.service';
import { ExportConfigService } from './export-config.service';
import { ExportConfigController } from './export-config.controller';
import { CsvExportEngine } from './engines/csv-export.engine';
import { ExcelExportEngine } from './engines/excel-export.engine';
import { PdfExportEngine } from './engines/pdf-export.engine';
import { GoogleSheetsClient } from './google-sheets/google-sheets.client';
import { SheetSyncService } from './google-sheets/sheet-sync.service';
import { ScheduledReportsWorker } from './scheduled-reports.worker';

import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ReportsController, ExportConfigController],
  providers: [
    ReportsService,
    GoogleSheetsClient,
    SheetSyncService,
    ExportPolicyEngine,
    ExportOrchestrationService,
    ExportConfigService,
    CsvExportEngine,
    ExcelExportEngine,
    PdfExportEngine,
    ScheduledReportsWorker,
  ],
  exports: [ReportsService, SheetSyncService],
})
export class ReportsModule {}
