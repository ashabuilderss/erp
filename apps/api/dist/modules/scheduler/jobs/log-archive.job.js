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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var LogArchiveJob_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogArchiveJob = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../../config/prisma.service");
let LogArchiveJob = LogArchiveJob_1 = class LogArchiveJob {
    prisma;
    storageProvider;
    logger = new common_1.Logger(LogArchiveJob_1.name);
    constructor(prisma, storageProvider) {
        this.prisma = prisma;
        this.storageProvider = storageProvider;
    }
    async handle() {
        this.logger.log('Monthly log archive check...');
        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - 3);
        const oldLogs = await this.prisma.activityLog.findMany({
            where: { createdAt: { lt: cutoff } },
            take: 5000,
        });
        if (oldLogs.length > 0) {
            const buffer = Buffer.from(JSON.stringify(oldLogs, null, 2));
            const filename = `archives/activity_logs_${cutoff.toISOString().split('T')[0]}.json`;
            await this.storageProvider.upload({
                buffer,
                originalname: filename,
                mimetype: 'application/json',
                size: buffer.length
            });
            await this.prisma.activityLog.deleteMany({
                where: { id: { in: oldLogs.map((l) => l.id) } },
            });
            this.logger.log(`Archived ${oldLogs.length} activity logs to S3 (older than 3 months)`);
        }
        const oldEvents = await this.prisma.securityEvent.findMany({
            where: { createdAt: { lt: cutoff } },
            take: 5000,
        });
        if (oldEvents.length > 0) {
            const buffer = Buffer.from(JSON.stringify(oldEvents, null, 2));
            const filename = `archives/security_events_${cutoff.toISOString().split('T')[0]}.json`;
            await this.storageProvider.upload({
                buffer,
                originalname: filename,
                mimetype: 'application/json',
                size: buffer.length
            });
            await this.prisma.securityEvent.deleteMany({
                where: { id: { in: oldEvents.map((e) => e.id) } },
            });
            this.logger.log(`Archived ${oldEvents.length} security events to S3 (older than 3 months)`);
        }
    }
};
exports.LogArchiveJob = LogArchiveJob;
__decorate([
    (0, schedule_1.Cron)('0 3 1 * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LogArchiveJob.prototype, "handle", null);
exports.LogArchiveJob = LogArchiveJob = LogArchiveJob_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)('STORAGE_PROVIDER')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], LogArchiveJob);
//# sourceMappingURL=log-archive.job.js.map