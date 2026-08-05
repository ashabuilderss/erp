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
var PhotoRetentionJob_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhotoRetentionJob = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../../config/prisma.service");
let PhotoRetentionJob = PhotoRetentionJob_1 = class PhotoRetentionJob {
    prisma;
    logger = new common_1.Logger(PhotoRetentionJob_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handle() {
        this.logger.log('Checking photo retention policies...');
        const companies = await this.prisma.company.findMany({
            where: { isActive: true },
            select: { id: true, settings: true },
        });
        for (const company of companies) {
            const settings = company.settings ?? {};
            const retentionDays = settings.photoRetentionDays ?? 365;
            if (retentionDays <= 0)
                continue;
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - retentionDays);
            const old = await this.prisma.progressPhoto.findMany({
                where: {
                    companyId: company.id,
                    takenAt: { lt: cutoff },
                },
                select: { id: true },
            });
            if (old.length > 0) {
                await this.prisma.progressPhoto.deleteMany({
                    where: { id: { in: old.map((p) => p.id) } },
                });
                this.logger.log(`Deleted ${old.length} progress photos older than ${retentionDays} days`);
            }
        }
    }
};
exports.PhotoRetentionJob = PhotoRetentionJob;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_1AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PhotoRetentionJob.prototype, "handle", null);
exports.PhotoRetentionJob = PhotoRetentionJob = PhotoRetentionJob_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PhotoRetentionJob);
//# sourceMappingURL=photo-retention.job.js.map