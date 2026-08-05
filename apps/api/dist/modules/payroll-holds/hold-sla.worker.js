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
var HoldSlaWorker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HoldSlaWorker = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../config/prisma.service");
const client_1 = require("@prisma/client");
const approvals_runtime_service_1 = require("../approvals/approvals-runtime.service");
let HoldSlaWorker = HoldSlaWorker_1 = class HoldSlaWorker {
    prisma;
    approvalsService;
    logger = new common_1.Logger(HoldSlaWorker_1.name);
    constructor(prisma, approvalsService) {
        this.prisma = prisma;
        this.approvalsService = approvalsService;
    }
    async handleSlaEscalations() {
        this.logger.debug('Running Hold SLA Worker...');
        const now = new Date();
        const slaThreshold = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        const stuckHolds = await this.prisma.payrollHold.findMany({
            where: {
                status: {
                    in: [
                        client_1.PayrollHoldStatus.REQUESTED,
                        client_1.PayrollHoldStatus.RELEASE_REQUESTED,
                    ],
                },
                updatedAt: { lt: slaThreshold },
                approvalId: { not: null },
            },
        });
        for (const hold of stuckHolds) {
            if (!hold.approvalId)
                continue;
            try {
                await this.prisma.$transaction(async (tx) => {
                    await this.approvalsService.escalateRequest(hold.approvalId);
                    await tx.payrollHold.update({
                        where: { id: hold.id },
                        data: { updatedAt: new Date() },
                    });
                    await tx.payrollHoldHistory.create({
                        data: {
                            holdId: hold.id,
                            companyId: hold.companyId,
                            event: 'HOLD_SLA_ESCALATED',
                            comments: `Hold pending > 48 hours. Approval workflow escalated.`,
                        },
                    });
                });
            }
            catch (err) {
                this.logger.error(`Failed to escalate hold ${hold.id}: ${err.message}`);
            }
        }
    }
};
exports.HoldSlaWorker = HoldSlaWorker;
__decorate([
    (0, schedule_1.Cron)('0 0 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HoldSlaWorker.prototype, "handleSlaEscalations", null);
exports.HoldSlaWorker = HoldSlaWorker = HoldSlaWorker_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        approvals_runtime_service_1.ApprovalsRuntimeService])
], HoldSlaWorker);
//# sourceMappingURL=hold-sla.worker.js.map