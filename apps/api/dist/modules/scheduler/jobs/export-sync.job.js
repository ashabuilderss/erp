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
var ExportSyncJob_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportSyncJob = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const advisory_lock_service_1 = require("../../../common/services/advisory-lock.service");
const sheet_sync_service_1 = require("../../reports/google-sheets/sheet-sync.service");
const EXPORT_SYNC_LOCK_KEY = 20260708;
let ExportSyncJob = ExportSyncJob_1 = class ExportSyncJob {
    lockService;
    syncService;
    logger = new common_1.Logger(ExportSyncJob_1.name);
    constructor(lockService, syncService) {
        this.lockService = lockService;
        this.syncService = syncService;
    }
    async handle() {
        this.logger.log('Checking for enabled export sync configs...');
        await this.lockService.runWithLock(EXPORT_SYNC_LOCK_KEY, async () => {
            const results = await this.syncService.syncAllEnabled();
            const completed = results.filter((r) => r.status === 'COMPLETED');
            const failed = results.filter((r) => r.status === 'FAILED');
            if (completed.length > 0) {
                this.logger.log(`Export sync completed: ${completed.length} configs`);
            }
            if (failed.length > 0) {
                this.logger.warn(`Export sync failed: ${failed.length} configs`);
            }
        });
    }
};
exports.ExportSyncJob = ExportSyncJob;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ExportSyncJob.prototype, "handle", null);
exports.ExportSyncJob = ExportSyncJob = ExportSyncJob_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [advisory_lock_service_1.AdvisoryLockService,
        sheet_sync_service_1.SheetSyncService])
], ExportSyncJob);
//# sourceMappingURL=export-sync.job.js.map