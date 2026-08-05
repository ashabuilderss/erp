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
var AttendanceMidnightFinalizationJob_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceMidnightFinalizationJob = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../../config/prisma.service");
const attendance_finalization_service_1 = require("../../hrms/attendance/attendance-finalization.service");
let AttendanceMidnightFinalizationJob = AttendanceMidnightFinalizationJob_1 = class AttendanceMidnightFinalizationJob {
    prisma;
    finalizationService;
    logger = new common_1.Logger(AttendanceMidnightFinalizationJob_1.name);
    constructor(prisma, finalizationService) {
        this.prisma = prisma;
        this.finalizationService = finalizationService;
    }
    async handleMidnightFinalization() {
        this.logger.log('Starting midnight attendance finalization job');
        try {
            const companies = await this.prisma.company.findMany({
                where: { isActive: true, deletedAt: null },
            });
            let successCount = 0;
            let failCount = 0;
            for (const company of companies) {
                try {
                    await this.finalizationService.finalizePreviousDay(company.id);
                    successCount++;
                }
                catch (error) {
                    this.logger.error(`Failed to finalize attendance for company ${company.id}`, error.stack);
                    failCount++;
                }
            }
            this.logger.log(`Midnight attendance finalization completed. Success: ${successCount}, Failed: ${failCount}`);
        }
        catch (error) {
            this.logger.error('Critical failure in midnight attendance finalization job', error.stack);
        }
    }
};
exports.AttendanceMidnightFinalizationJob = AttendanceMidnightFinalizationJob;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AttendanceMidnightFinalizationJob.prototype, "handleMidnightFinalization", null);
exports.AttendanceMidnightFinalizationJob = AttendanceMidnightFinalizationJob = AttendanceMidnightFinalizationJob_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        attendance_finalization_service_1.AttendanceFinalizationService])
], AttendanceMidnightFinalizationJob);
//# sourceMappingURL=attendance-midnight-finalization.job.js.map