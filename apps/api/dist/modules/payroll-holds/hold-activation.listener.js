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
var HoldActivationListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HoldActivationListener = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
const client_1 = require("@prisma/client");
let HoldActivationListener = HoldActivationListener_1 = class HoldActivationListener {
    prisma;
    logger = new common_1.Logger(HoldActivationListener_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async processActivationOutcome(approvalId, status) {
        const hold = await this.prisma.payrollHold.findUnique({
            where: { approvalId },
        });
        if (!hold || hold.status !== client_1.PayrollHoldStatus.REQUESTED)
            return;
        if (status === client_1.ApprovalStatus.APPROVED) {
            const result = await this.prisma.payrollHold.updateMany({
                where: {
                    id: hold.id,
                    status: client_1.PayrollHoldStatus.REQUESTED,
                },
                data: {
                    status: client_1.PayrollHoldStatus.ACTIVE_HOLD,
                },
            });
            if (result.count === 0) {
                this.logger.warn(`Hold ${hold.id} activation aborted: Optimistic lock failed or already transitioned.`);
                return;
            }
            await this.prisma.payrollHoldHistory.create({
                data: {
                    holdId: hold.id,
                    companyId: hold.companyId,
                    event: 'HOLD_ACTIVATED',
                    comments: `Payroll Hold APPROVED and ACTIVATED.`,
                },
            });
        }
        else if (status === client_1.ApprovalStatus.REJECTED) {
            const result = await this.prisma.payrollHold.updateMany({
                where: {
                    id: hold.id,
                    status: client_1.PayrollHoldStatus.REQUESTED,
                },
                data: {
                    status: client_1.PayrollHoldStatus.REJECTED,
                },
            });
            if (result.count > 0) {
                await this.prisma.payrollHoldHistory.create({
                    data: {
                        holdId: hold.id,
                        companyId: hold.companyId,
                        event: 'HOLD_REJECTED',
                        comments: `Payroll Hold REJECTED.`,
                    },
                });
            }
        }
    }
    async createEmergencyHold(companyId, ownerUserId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: ownerUserId },
        });
        if (!user || user.role !== client_1.UserRole.OWNER) {
            throw new common_1.ForbiddenException('Only owners can activate emergency holds.');
        }
        const owner = await this.prisma.employee.findFirst({
            where: { userId: ownerUserId, companyId },
        });
        if (!owner)
            throw new common_1.BadRequestException('Owner employee profile not found.');
        const employee = await this.prisma.employee.findFirst({
            where: { id: dto.employeeId, companyId },
        });
        if (!employee)
            throw new common_1.BadRequestException('Employee not found.');
        return await this.prisma.$transaction(async (tx) => {
            const hold = await tx.payrollHold.create({
                data: {
                    companyId,
                    employeeId: employee.id,
                    source: client_1.PayrollHoldSource.OWNER_MANUAL,
                    holdType: dto.holdType,
                    amount: dto.amount,
                    reason: dto.reason,
                    createdById: owner.id,
                    status: client_1.PayrollHoldStatus.ACTIVE_HOLD,
                },
            });
            await tx.payrollHoldHistory.create({
                data: {
                    holdId: hold.id,
                    companyId,
                    event: 'OWNER_EMERGENCY_HOLD',
                    actorId: owner.id,
                    comments: `Emergency hold activated directly by Owner. Reason: ${dto.reason}`,
                },
            });
            return hold;
        });
    }
};
exports.HoldActivationListener = HoldActivationListener;
exports.HoldActivationListener = HoldActivationListener = HoldActivationListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HoldActivationListener);
//# sourceMappingURL=hold-activation.listener.js.map