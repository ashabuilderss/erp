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
exports.PaymentEntriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
let PaymentEntriesService = class PaymentEntriesService {
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
        return this.prisma.paymentEntry.findMany({
            where: { bookingId },
            orderBy: { paymentDate: 'desc' },
            include: { employees: { select: { employeeCode: true } } },
        });
    }
    async create(bookingId, dto, recordedById, companyId) {
        const booking = await this.prisma.booking.findFirst({
            where: { id: bookingId, companyId },
        });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        if (booking.status === 'CANCELLED') {
            throw new common_1.BadRequestException('Cannot record payment against a cancelled booking');
        }
        if (booking.paymentStatus === 'COMPLETED') {
            throw new common_1.BadRequestException('Booking payment is already completed');
        }
        const existingTotal = await this.prisma.paymentEntry.aggregate({
            where: { bookingId },
            _sum: { amount: true },
        });
        const totalPaid = Number(existingTotal._sum.amount ?? 0);
        if (totalPaid + dto.amount > Number(booking.amount)) {
            throw new common_1.BadRequestException(`Payment amount (${dto.amount}) would exceed remaining balance. Booking amount: ${booking.amount.toString()}, already paid: ${totalPaid}`);
        }
        return this.prisma.$transaction(async (tx) => {
            const entry = await tx.paymentEntry.create({
                data: {
                    bookingId,
                    companyId,
                    amount: dto.amount,
                    method: dto.method,
                    reference: dto.reference,
                    paymentDate: new Date(dto.paymentDate),
                    notes: dto.notes,
                    recordedById,
                },
            });
            const newTotal = totalPaid + dto.amount;
            const bookingAmount = Number(booking.amount);
            let newPaymentStatus = 'PENDING';
            if (newTotal >= bookingAmount) {
                newPaymentStatus = 'COMPLETED';
            }
            else if (newTotal > 0) {
                newPaymentStatus = 'PARTIAL';
            }
            await tx.booking.update({
                where: { id: bookingId },
                data: { paymentStatus: newPaymentStatus },
            });
            return entry;
        });
    }
    async update(id, dto, companyId) {
        const entry = await this.prisma.paymentEntry.findFirst({
            where: { id, bookings: { companyId } },
        });
        if (!entry)
            throw new common_1.NotFoundException('Payment entry not found');
        return this.prisma.paymentEntry.update({
            where: { id },
            data: {
                ...(dto.amount !== undefined && { amount: dto.amount }),
                ...(dto.method !== undefined && { method: dto.method }),
                ...(dto.reference !== undefined && { reference: dto.reference }),
                ...(dto.paymentDate !== undefined && {
                    paymentDate: new Date(dto.paymentDate),
                }),
                ...(dto.notes !== undefined && { notes: dto.notes }),
            },
        });
    }
    async remove(id, companyId) {
        const entry = await this.prisma.paymentEntry.findFirst({
            where: { id, bookings: { companyId } },
        });
        if (!entry)
            throw new common_1.NotFoundException('Payment entry not found');
        return this.prisma.paymentEntry.update({ where: { id }, data: { deletedAt: new Date() } });
    }
};
exports.PaymentEntriesService = PaymentEntriesService;
exports.PaymentEntriesService = PaymentEntriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentEntriesService);
//# sourceMappingURL=payment-entries.service.js.map