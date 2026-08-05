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
var WarningAckSlaWorker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarningAckSlaWorker = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../config/prisma.service");
const client_1 = require("@prisma/client");
let WarningAckSlaWorker = WarningAckSlaWorker_1 = class WarningAckSlaWorker {
    prisma;
    logger = new common_1.Logger(WarningAckSlaWorker_1.name);
    SLA_HOURS = {
        LEVEL_1_VERBAL: 48,
        LEVEL_2_WRITTEN: 24,
        LEVEL_3_FINAL: 12,
    };
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handleAckSlaBreaches() {
        this.logger.debug('Running Warning Ack SLA Worker...');
        const now = new Date();
        const unacknowledged = await this.prisma.warning.findMany({
            where: {
                status: client_1.ApprovalStatus.APPROVED,
                acknowledgedAt: null,
            },
            include: {
                warningHistories: {
                    where: { event: 'ACK_SLA_BREACHED' },
                },
            },
        });
        for (const warning of unacknowledged) {
            if (warning.warningHistories.length > 0)
                continue;
            const slaHours = this.SLA_HOURS[warning.severity] ?? 48;
            const slaDeadline = new Date(warning.createdAt.getTime() + slaHours * 60 * 60 * 1000);
            if (now <= slaDeadline)
                continue;
            try {
                await this.prisma.$transaction(async (tx) => {
                    await tx.warningHistory.create({
                        data: {
                            warningId: warning.id,
                            companyId: warning.companyId,
                            event: 'ACK_SLA_BREACHED',
                            comments: `Acknowledgement SLA of ${slaHours}h breached for ${warning.severity} warning. Escalating to Owner.`,
                        },
                    });
                });
                this.logger.log(`SLA breached for warning ${warning.id} (${warning.severity}).`);
            }
            catch (err) {
                this.logger.error(`Failed to process SLA breach for warning ${warning.id}: ${err.message}`);
            }
        }
    }
};
exports.WarningAckSlaWorker = WarningAckSlaWorker;
__decorate([
    (0, schedule_1.Cron)('0 */30 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WarningAckSlaWorker.prototype, "handleAckSlaBreaches", null);
exports.WarningAckSlaWorker = WarningAckSlaWorker = WarningAckSlaWorker_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WarningAckSlaWorker);
//# sourceMappingURL=warning-ack-sla.worker.js.map