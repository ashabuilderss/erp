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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentSchedulesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
let PaymentSchedulesService = class PaymentSchedulesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByBooking(bookingId, companyId) {
        const booking = await this.prisma.booking.findFirst({
            where: { id: bookingId, companyId },
        });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        return this.prisma.paymentSchedule.findMany({
            where: { bookingId },
            orderBy: { installmentNumber: 'asc' },
        });
    }
    async create(bookingId, dto, companyId) {
        const booking = await this.prisma.booking.findFirst({
            where: { id: bookingId, companyId },
        });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        if (booking.status === 'CANCELLED') {
            throw new common_1.BadRequestException('Cannot create payment schedule for a cancelled booking');
        }
        return this.prisma.paymentSchedule.create({
            data: {
                bookingId,
                companyId,
                installmentNumber: dto.installmentNumber,
                amount: dto.amount,
                dueDate: new Date(dto.dueDate),
                status: dto.status ?? 'PENDING',
                notes: dto.notes,
            },
        });
    }
    async update(id, dto, companyId) {
        const schedule = await this.prisma.paymentSchedule.findFirst({
            where: { id, bookings: { companyId } },
        });
        if (!schedule)
            throw new common_1.NotFoundException('Payment schedule not found');
        const updated = await this.prisma.paymentSchedule.update({
            where: { id },
            data: {
                ...(dto.amount !== undefined && { amount: dto.amount }),
                ...(dto.dueDate !== undefined && { dueDate: new Date(dto.dueDate) }),
                ...(dto.paidDate !== undefined && { paidDate: new Date(dto.paidDate) }),
                ...(dto.status !== undefined && { status: dto.status }),
                ...(dto.notes !== undefined && { notes: dto.notes }),
            },
        });
        if (dto.status && dto.status !== schedule.status) {
            await this.syncBookingPaymentStatus(schedule.bookingId);
        }
        return updated;
    }
    async syncBookingPaymentStatus(bookingId) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            select: { amount: true, paymentStatus: true },
        });
        if (!booking)
            return;
        const schedules = await this.prisma.paymentSchedule.findMany({
            where: { bookingId },
            select: { amount: true, status: true },
        });
        const totalScheduled = schedules.reduce((sum, s) => sum + Number(s.amount), 0);
        const totalPaid = schedules
            .filter((s) => s.status === 'PAID')
            .reduce((sum, s) => sum + Number(s.amount), 0);
        let newPaymentStatus = 'PENDING';
        if (totalPaid >= Number(booking.amount) || totalPaid >= totalScheduled) {
            newPaymentStatus = 'COMPLETED';
        }
        else if (totalPaid > 0) {
            newPaymentStatus = 'PARTIAL';
        }
        if (newPaymentStatus !== booking.paymentStatus) {
            await this.prisma.booking.update({
                where: { id: bookingId },
                data: { paymentStatus: newPaymentStatus },
            });
        }
    }
    async remove(id, companyId) {
        const schedule = await this.prisma.paymentSchedule.findFirst({
            where: { id, bookings: { companyId } },
        });
        if (!schedule)
            throw new common_1.NotFoundException('Payment schedule not found');
        return this.prisma.paymentSchedule.update({ where: { id }, data: { deletedAt: new Date() } });
    }
};
exports.PaymentSchedulesService = PaymentSchedulesService;
exports.PaymentSchedulesService = PaymentSchedulesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentSchedulesService);
//# sourceMappingURL=payment-schedules.service.js.map