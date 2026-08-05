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
var WarningExpirationWorker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarningExpirationWorker = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../config/prisma.service");
const client_1 = require("@prisma/client");
let WarningExpirationWorker = WarningExpirationWorker_1 = class WarningExpirationWorker {
    prisma;
    logger = new common_1.Logger(WarningExpirationWorker_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handleWarningExpirations() {
        this.logger.debug('Running Warning Expiration Worker...');
        const now = new Date();
        const expiredWarnings = await this.prisma.warning.findMany({
            where: {
                status: client_1.ApprovalStatus.APPROVED,
                expiresAt: { lt: now },
            },
            include: {
                warningHistories: {
                    where: { event: 'WARNING_EXPIRED' },
                },
            },
        });
        for (const warning of expiredWarnings) {
            if (warning.warningHistories.length > 0)
                continue;
            try {
                await this.prisma.$transaction(async (tx) => {
                    await tx.warningHistory.create({
                        data: {
                            warningId: warning.id,
                            companyId: warning.companyId,
                            event: 'WARNING_EXPIRED',
                            comments: `Warning expiration period reached.`,
                        },
                    });
                });
            }
            catch (err) {
                this.logger.error(`Failed to process expiration for warning ${warning.id}: ${err.message}`);
            }
        }
    }
};
exports.WarningExpirationWorker = WarningExpirationWorker;
__decorate([
    (0, schedule_1.Cron)('0 0 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WarningExpirationWorker.prototype, "handleWarningExpirations", null);
exports.WarningExpirationWorker = WarningExpirationWorker = WarningExpirationWorker_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WarningExpirationWorker);
//# sourceMappingURL=warning-expiration.worker.js.map