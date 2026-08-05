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
var HoldReleaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HoldReleaseService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
const transition_service_1 = require("../../common/services/transition.service");
const client_1 = require("@prisma/client");
const approvals_1 = require("../approvals");
let HoldReleaseService = HoldReleaseService_1 = class HoldReleaseService {
    prisma;
    spawningService;
    transitionService;
    logger = new common_1.Logger(HoldReleaseService_1.name);
    constructor(prisma, spawningService, transitionService) {
        this.prisma = prisma;
        this.spawningService = spawningService;
        this.transitionService = transitionService;
    }
    async requestRelease(companyId, holdId, actorUserId, dto) {
        const actor = await this.prisma.employee.findFirst({
            where: { userId: actorUserId, companyId },
        });
        if (!actor)
            throw new common_1.BadRequestException('Actor employee not found.');
        const hold = await this.prisma.payrollHold.findFirst({
            where: { id: holdId, companyId },
        });
        if (!hold)
            throw new common_1.BadRequestException('Hold not found.');
        if (hold.status === client_1.PayrollHoldStatus.RELEASE_REQUESTED) {
            throw new common_1.ConflictException('A release request is already pending for this hold.');
        }
        if (hold.status !== client_1.PayrollHoldStatus.ACTIVE_HOLD) {
            throw new common_1.BadRequestException('Only an ACTIVE_HOLD can be released.');
        }
        this.transitionService.validate('PayrollHold', hold.status, client_1.PayrollHoldStatus.RELEASE_REQUESTED);
        return await this.prisma.$transaction(async (tx) => {
            const updateResult = await tx.payrollHold.updateMany({
                where: {
                    id: hold.id,
                    status: client_1.PayrollHoldStatus.ACTIVE_HOLD,
                },
                data: {
                    status: client_1.PayrollHoldStatus.RELEASE_REQUESTED,
                },
            });
            if (updateResult.count === 0) {
                throw new common_1.ConflictException('Hold state changed concurrently. Request aborted.');
            }
            await tx.payrollHoldHistory.create({
                data: {
                    holdId: hold.id,
                    companyId: hold.companyId,
                    event: 'HOLD_RELEASE_REQUESTED',
                    actorId: actor.id,
                    comments: `Release requested. Reason: ${dto.reason}`,
                },
            });
            const approvalReq = await this.spawningService.spawnRequest(companyId, 'PAYROLL_RELEASE', hold.id, actorUserId);
            await tx.payrollHold.update({
                where: { id: hold.id },
                data: { approvalId: approvalReq.id },
            });
            return { status: 'RELEASE_REQUESTED' };
        });
    }
    async processReleaseOutcome(approvalId, status) {
        const hold = await this.prisma.payrollHold.findUnique({
            where: { approvalId },
        });
        if (!hold || hold.status !== client_1.PayrollHoldStatus.RELEASE_REQUESTED)
            return;
        if (status === client_1.ApprovalStatus.APPROVED) {
            this.transitionService.validate('PayrollHold', hold.status, client_1.PayrollHoldStatus.RELEASED);
            const result = await this.prisma.payrollHold.updateMany({
                where: { id: hold.id, status: client_1.PayrollHoldStatus.RELEASE_REQUESTED },
                data: { status: client_1.PayrollHoldStatus.RELEASED },
            });
            if (result.count > 0) {
                await this.prisma.payrollHoldHistory.create({
                    data: {
                        holdId: hold.id,
                        companyId: hold.companyId,
                        event: 'HOLD_RELEASED',
                        comments: 'Payroll Hold Release APPROVED.',
                    },
                });
            }
        }
        else if (status === client_1.ApprovalStatus.REJECTED) {
            this.transitionService.validate('PayrollHold', hold.status, client_1.PayrollHoldStatus.ACTIVE_HOLD);
            const result = await this.prisma.payrollHold.updateMany({
                where: { id: hold.id, status: client_1.PayrollHoldStatus.RELEASE_REQUESTED },
                data: { status: client_1.PayrollHoldStatus.ACTIVE_HOLD },
            });
            if (result.count > 0) {
                await this.prisma.payrollHoldHistory.create({
                    data: {
                        holdId: hold.id,
                        companyId: hold.companyId,
                        event: 'HOLD_RELEASE_REJECTED',
                        comments: 'Payroll Hold Release REJECTED.',
                    },
                });
            }
        }
    }
};
exports.HoldReleaseService = HoldReleaseService;
exports.HoldReleaseService = HoldReleaseService = HoldReleaseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        approvals_1.ApprovalsSpawningService,
        transition_service_1.TransitionService])
], HoldReleaseService);
//# sourceMappingURL=hold-release.service.js.map