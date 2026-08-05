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
var CommissionListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommissionListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../../config/prisma.service");
const transition_service_1 = require("../../common/services/transition.service");
let CommissionListener = CommissionListener_1 = class CommissionListener {
    prisma;
    transitionService;
    logger = new common_1.Logger(CommissionListener_1.name);
    constructor(prisma, transitionService) {
        this.prisma = prisma;
        this.transitionService = transitionService;
    }
    async handleBookingCreated(payload) {
        const maxRetries = 3;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const existing = await this.prisma.pipelineCommission.findFirst({
                    where: { bookingId: payload.entityId, companyId: payload.companyId },
                });
                if (existing) {
                    this.logger.log(`Commission already exists for booking ${payload.entityId}, skipping`);
                    return;
                }
                const booking = await this.prisma.booking.findUnique({
                    where: { id: payload.entityId },
                    include: { employees: true },
                });
                if (!booking || !booking.assignedToEmployeeId)
                    return;
                const company = await this.prisma.company.findUnique({
                    where: { id: payload.companyId },
                    select: { settings: true },
                });
                const settings = company?.settings ?? {};
                const defaultPct = settings.commissionPercentage ?? 5;
                const commissionAmount = Number(booking.amount) * (defaultPct / 100);
                await this.prisma.pipelineCommission.create({
                    data: {
                        companyId: payload.companyId,
                        bookingId: booking.id,
                        leadId: booking.leadId,
                        employeeId: booking.assignedToEmployeeId,
                        amount: commissionAmount,
                        percentage: defaultPct,
                        status: 'PENDING',
                    },
                });
                this.logger.log(`Auto-created commission (${defaultPct}% = ${commissionAmount}) for booking ${booking.id}`);
                return;
            }
            catch (err) {
                this.logger.error(`Commission creation attempt ${attempt}/${maxRetries} failed for booking ${payload.entityId}`, err instanceof Error ? err.stack : err);
                if (attempt === maxRetries) {
                    this.logger.error(`All ${maxRetries} attempts failed. Commission for booking ${payload.entityId} needs manual creation.`);
                }
                else {
                    await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
                }
            }
        }
    }
    async handleBookingCancelled(payload) {
        try {
            const commissions = await this.prisma.pipelineCommission.findMany({
                where: {
                    bookingId: payload.entityId,
                    companyId: payload.companyId,
                    status: { in: ['PENDING', 'APPROVED'] },
                },
            });
            for (const commission of commissions) {
                this.transitionService.validate('Commission', commission.status, 'CANCELLED');
                await this.prisma.pipelineCommission.update({
                    where: { id: commission.id },
                    data: { status: 'CANCELLED' },
                });
                this.logger.log(`Auto-cancelled commission ${commission.id} for cancelled booking ${payload.entityId}`);
            }
        }
        catch (err) {
            this.logger.error(`Failed to cancel commissions for booking ${payload.entityId}`, err instanceof Error ? err.stack : err);
        }
    }
    async handleBookingUpdated(payload) {
        try {
            const booking = await this.prisma.booking.findUnique({
                where: { id: payload.entityId },
            });
            if (!booking)
                return;
            const commission = await this.prisma.pipelineCommission.findFirst({
                where: {
                    bookingId: payload.entityId,
                    companyId: payload.companyId,
                },
            });
            if (!commission)
                return;
            const company = await this.prisma.company.findUnique({
                where: { id: payload.companyId },
                select: { settings: true },
            });
            const settings = company?.settings ?? {};
            const defaultPct = settings.commissionPercentage ?? 5;
            const newAmount = Number(booking.amount) * (defaultPct / 100);
            if (Number(commission.amount) !== newAmount ||
                Number(commission.percentage) !== defaultPct) {
                await this.prisma.pipelineCommission.update({
                    where: { id: commission.id },
                    data: {
                        amount: newAmount,
                        percentage: defaultPct,
                    },
                });
                this.logger.log(`Recalculated commission ${commission.id}: ${defaultPct}% = ${newAmount} for booking ${payload.entityId}`);
            }
        }
        catch (err) {
            this.logger.error(`Failed to update commission for booking ${payload.entityId}`, err instanceof Error ? err.stack : err);
        }
    }
    async handleBookingDeleted(payload) {
        try {
            const deleted = await this.prisma.pipelineCommission.deleteMany({
                where: {
                    bookingId: payload.entityId,
                    companyId: payload.companyId,
                },
            });
            if (deleted.count > 0) {
                this.logger.log(`Deleted ${deleted.count} commission(s) for deleted booking ${payload.entityId}`);
            }
        }
        catch (err) {
            this.logger.error(`Failed to delete commissions for booking ${payload.entityId}`, err instanceof Error ? err.stack : err);
        }
    }
};
exports.CommissionListener = CommissionListener;
__decorate([
    (0, event_emitter_1.OnEvent)('booking.created'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CommissionListener.prototype, "handleBookingCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)('booking.cancelled'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CommissionListener.prototype, "handleBookingCancelled", null);
__decorate([
    (0, event_emitter_1.OnEvent)('booking.updated'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CommissionListener.prototype, "handleBookingUpdated", null);
__decorate([
    (0, event_emitter_1.OnEvent)('booking.deleted'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CommissionListener.prototype, "handleBookingDeleted", null);
exports.CommissionListener = CommissionListener = CommissionListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        transition_service_1.TransitionService])
], CommissionListener);
//# sourceMappingURL=commission-listener.js.map