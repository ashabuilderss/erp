"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsModule = void 0;
const common_1 = require("@nestjs/common");
const reports_service_1 = require("./reports.service");
const reports_controller_1 = require("./reports.controller");
const export_policy_engine_1 = require("./export-policy.engine");
const export_orchestration_service_1 = require("./export-orchestration.service");
const export_config_service_1 = require("./export-config.service");
const export_config_controller_1 = require("./export-config.controller");
const csv_export_engine_1 = require("./engines/csv-export.engine");
const excel_export_engine_1 = require("./engines/excel-export.engine");
const pdf_export_engine_1 = require("./engines/pdf-export.engine");
const google_sheets_client_1 = require("./google-sheets/google-sheets.client");
const sheet_sync_service_1 = require("./google-sheets/sheet-sync.service");
const scheduled_reports_worker_1 = require("./scheduled-reports.worker");
const audit_module_1 = require("../audit/audit.module");
let ReportsModule = class ReportsModule {
};
exports.ReportsModule = ReportsModule;
exports.ReportsModule = ReportsModule = __decorate([
    (0, common_1.Module)({
        imports: [audit_module_1.AuditModule],
        controllers: [reports_controller_1.ReportsController, export_config_controller_1.ExportConfigController],
        providers: [
            reports_service_1.ReportsService,
            google_sheets_client_1.GoogleSheetsClient,
            sheet_sync_service_1.SheetSyncService,
            export_policy_engine_1.ExportPolicyEngine,
            export_orchestration_service_1.ExportOrchestrationService,
            export_config_service_1.ExportConfigService,
            csv_export_engine_1.CsvExportEngine,
            excel_export_engine_1.ExcelExportEngine,
            pdf_export_engine_1.PdfExportEngine,
            scheduled_reports_worker_1.ScheduledReportsWorker,
        ],
        exports: [reports_service_1.ReportsService, sheet_sync_service_1.SheetSyncService],
    })
], ReportsModule);
//# sourceMappingURL=reports.module.js.map