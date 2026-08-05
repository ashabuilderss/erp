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
var WarningApprovalListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarningApprovalListener = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
const transition_service_1 = require("../../common/services/transition.service");
const client_1 = require("@prisma/client");
let WarningApprovalListener = WarningApprovalListener_1 = class WarningApprovalListener {
    prisma;
    transitionService;
    logger = new common_1.Logger(WarningApprovalListener_1.name);
    constructor(prisma, transitionService) {
        this.prisma = prisma;
        this.transitionService = transitionService;
    }
    async processWarningApprovalOutcome(approvalId, status) {
        const warning = await this.prisma.warning.findFirst({
            where: { approvalId, status: client_1.ApprovalStatus.PENDING },
        });
        if (!warning)
            return;
        this.transitionService.validate('Warning', warning.status, status);
        await this.prisma.$transaction(async (tx) => {
            await tx.warning.update({
                where: { id: warning.id },
                data: { status },
            });
            await tx.warningHistory.create({
                data: {
                    warningId: warning.id,
                    companyId: warning.companyId,
                    event: status === client_1.ApprovalStatus.APPROVED
                        ? 'WARNING_APPROVED'
                        : 'WARNING_REJECTED',
                    comments: `Warning approval request was ${status.toLowerCase()} by management.`,
                },
            });
        });
    }
};
exports.WarningApprovalListener = WarningApprovalListener;
exports.WarningApprovalListener = WarningApprovalListener = WarningApprovalListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        transition_service_1.TransitionService])
], WarningApprovalListener);
//# sourceMappingURL=warning-approval.listener.js.map