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
var ApprovalsSlaWorker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalsSlaWorker = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../config/prisma.service");
const client_1 = require("@prisma/client");
let ApprovalsSlaWorker = ApprovalsSlaWorker_1 = class ApprovalsSlaWorker {
    prisma;
    logger = new common_1.Logger(ApprovalsSlaWorker_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handleSlaBreaches() {
        this.logger.debug('Running SLA Breach Check for Approvals...');
        const now = new Date();
        const expiredSteps = await this.prisma.approvalStep.findMany({
            where: {
                status: client_1.ApprovalStatus.PENDING,
                slaDeadline: { lt: now },
            },
            include: {
                approvalRequests: true,
            },
        });
        if (expiredSteps.length === 0)
            return;
        for (const step of expiredSteps) {
            try {
                await this.prisma.$transaction(async (tx) => {
                    const currentStep = await tx.approvalStep.findUnique({
                        where: { id: step.id },
                    });
                    if (!currentStep || currentStep.status !== client_1.ApprovalStatus.PENDING)
                        return;
                    const newEscalationLevel = currentStep.escalationLevel + 1;
                    let reRoutedUserId = null;
                    const auditAction = 'SLA_ESCALATED';
                    let auditComments = `Step breached SLA. Escalation Level: ${newEscalationLevel}.`;
                    if (newEscalationLevel === 1 && currentStep.requiredUserId) {
                        const requiredEmployee = await tx.employee.findFirst({
                            where: { userId: currentStep.requiredUserId },
                        });
                        if (requiredEmployee) {
                            const delegation = await tx.delegation.findFirst({
                                where: {
                                    delegatorId: requiredEmployee.id,
                                    isActive: true,
                                    validFrom: { lte: now },
                                    validTo: { gte: now },
                                },
                                include: { employeesDelegationsDelegateIdToemployees: true },
                            });
                            if (delegation &&
                                delegation.employeesDelegationsDelegateIdToemployees &&
                                delegation.employeesDelegationsDelegateIdToemployees.userId) {
                                reRoutedUserId =
                                    delegation.employeesDelegationsDelegateIdToemployees.userId;
                                auditComments += ` Routed to Delegate: ${reRoutedUserId}.`;
                            }
                        }
                    }
                    if (!reRoutedUserId) {
                        const owner = await tx.user.findFirst({
                            where: {
                                companyId: step.approvalRequests.companyId,
                                role: 'OWNER',
                            },
                        });
                        if (owner) {
                            reRoutedUserId = owner.id;
                            auditComments += ` Routed directly to Company Owner.`;
                        }
                        else {
                            auditComments += ` Failed to find Owner to route to.`;
                        }
                    }
                    const extendedDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                    await tx.approvalStep.update({
                        where: { id: step.id },
                        data: {
                            escalationLevel: newEscalationLevel,
                            requiredUserId: reRoutedUserId || currentStep.requiredUserId,
                            slaDeadline: extendedDeadline,
                        },
                    });
                    if (step.approvalRequests.status !== client_1.ApprovalStatus.ESCALATED) {
                        await tx.approvalRequest.update({
                            where: { id: step.requestId },
                            data: { status: client_1.ApprovalStatus.ESCALATED },
                        });
                    }
                    await tx.approvalHistory.create({
                        data: {
                            companyId: step.approvalRequests.companyId,
                            requestId: step.requestId,
                            stepId: step.id,
                            action: auditAction,
                            comments: auditComments,
                        },
                    });
                });
            }
            catch (err) {
                this.logger.error(`Failed to process SLA breach for step ${step.id}: ${err.message}`);
            }
        }
    }
};
exports.ApprovalsSlaWorker = ApprovalsSlaWorker;
__decorate([
    (0, schedule_1.Cron)('0 */15 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ApprovalsSlaWorker.prototype, "handleSlaBreaches", null);
exports.ApprovalsSlaWorker = ApprovalsSlaWorker = ApprovalsSlaWorker_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ApprovalsSlaWorker);
//# sourceMappingURL=approvals-sla.worker.js.map