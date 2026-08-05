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
var AttendanceSelfieCleanupJob_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceSelfieCleanupJob = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../../config/prisma.service");
let AttendanceSelfieCleanupJob = AttendanceSelfieCleanupJob_1 = class AttendanceSelfieCleanupJob {
    prisma;
    logger = new common_1.Logger(AttendanceSelfieCleanupJob_1.name);
    RETENTION_DAYS = 90;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handle() {
        this.logger.log('Running attendance selfie cleanup...');
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - this.RETENTION_DAYS);
        const staleEvidence = await this.prisma.attendanceEvidence.findMany({
            where: {
                type: 'SELFIE',
                createdAt: { lt: cutoff },
            },
            select: { id: true, storageObjectId: true },
        });
        if (staleEvidence.length === 0) {
            this.logger.log('No stale attendance selfies found.');
            return;
        }
        const storageObjectIds = staleEvidence
            .map((e) => e.storageObjectId)
            .filter((id) => id !== null && id !== undefined);
        if (storageObjectIds.length === 0)
            return;
        const deleted = await this.prisma.storageObject.deleteMany({
            where: { id: { in: storageObjectIds } },
        });
        this.logger.log(`Deleted ${deleted.count} attendance selfie storage objects (evidence metadata retained).`);
    }
};
exports.AttendanceSelfieCleanupJob = AttendanceSelfieCleanupJob;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_3AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AttendanceSelfieCleanupJob.prototype, "handle", null);
exports.AttendanceSelfieCleanupJob = AttendanceSelfieCleanupJob = AttendanceSelfieCleanupJob_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AttendanceSelfieCleanupJob);
//# sourceMappingURL=attendance-selfie-cleanup.job.js.map