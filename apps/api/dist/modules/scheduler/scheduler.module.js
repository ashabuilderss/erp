"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_module_1 = require("../../config/prisma.module");
const common_services_module_1 = require("../../common/services/common-services.module");
const missing_punchout_job_1 = require("./jobs/missing-punchout.job");
const task_overdue_job_1 = require("./jobs/task-overdue.job");
const weekly_off_holiday_sync_job_1 = require("./jobs/weekly-off-holiday-sync.job");
const photo_retention_job_1 = require("./jobs/photo-retention.job");
const log_archive_job_1 = require("./jobs/log-archive.job");
const escalation_trigger_job_1 = require("./jobs/escalation-trigger.job");
const attendance_selfie_cleanup_job_1 = require("./jobs/attendance-selfie-cleanup.job");
const export_sync_job_1 = require("./jobs/export-sync.job");
const export_retention_job_1 = require("./jobs/export-retention.job");
const attendance_midnight_finalization_job_1 = require("./jobs/attendance-midnight-finalization.job");
const attendance_module_1 = require("../hrms/attendance/attendance.module");
const reports_module_1 = require("../reports/reports.module");
let SchedulerModule = class SchedulerModule {
};
exports.SchedulerModule = SchedulerModule;
exports.SchedulerModule = SchedulerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            common_services_module_1.CommonServicesModule,
            attendance_module_1.AttendanceModule,
            reports_module_1.ReportsModule,
        ],
        providers: [
            missing_punchout_job_1.MissingPunchoutJob,
            task_overdue_job_1.TaskOverdueJob,
            weekly_off_holiday_sync_job_1.WeeklyOffHolidaySyncJob,
            photo_retention_job_1.PhotoRetentionJob,
            log_archive_job_1.LogArchiveJob,
            escalation_trigger_job_1.EscalationTriggerJob,
            attendance_selfie_cleanup_job_1.AttendanceSelfieCleanupJob,
            export_sync_job_1.ExportSyncJob,
            export_retention_job_1.ExportRetentionJob,
            attendance_midnight_finalization_job_1.AttendanceMidnightFinalizationJob,
        ],
    })
], SchedulerModule);
//# sourceMappingURL=scheduler.module.js.map