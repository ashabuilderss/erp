import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import {
  CreatePaymentEntryDto,
  UpdatePaymentEntryDto,
} from './dto/create-payment-entry.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PaymentEntriesService {
  constructor(private prisma: PrismaService) {}

  async findByBooking(bookingId: string, companyId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, companyId },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    return this.prisma.paymentEntry.findMany({
      where: { bookingId },
      orderBy: { paymentDate: 'desc' },
      include: { employees: { select: { employeeCode: true } } },
    });
  }

  async create(
    bookingId: string,
    dto: CreatePaymentEntryDto,
    recordedById: string,
    companyId: string,
  ) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, companyId },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.status === 'CANCELLED') {
      throw new BadRequestException(
        'Cannot record payment against a cancelled booking',
      );
    }

    if (booking.paymentStatus === 'COMPLETED') {
      throw new BadRequestException('Booking payment is already completed');
    }

    const existingTotal = await this.prisma.paymentEntry.aggregate({
      where: { bookingId },
      _sum: { amount: true },
    });
    const totalPaid = Number(existingTotal._sum.amount ?? 0);
    if (totalPaid + dto.amount > Number(booking.amount)) {
      throw new BadRequestException(
        `Payment amount (${dto.amount}) would exceed remaining balance. Booking amount: ${booking.amount.toString()}, already paid: ${totalPaid}`,
      );
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
      let newPaymentStatus: 'PENDING' | 'PARTIAL' | 'COMPLETED' = 'PENDING';
      if (newTotal >= bookingAmount) {
        newPaymentStatus = 'COMPLETED';
      } else if (newTotal > 0) {
        newPaymentStatus = 'PARTIAL';
      }

      await tx.booking.update({
        where: { id: bookingId },
        data: { paymentStatus: newPaymentStatus },
      });

      return entry;
    });
  }

  async update(id: string, dto: UpdatePaymentEntryDto, companyId: string) {
    const entry = await this.prisma.paymentEntry.findFirst({
      where: { id, bookings: { companyId } },
    });
    if (!entry) throw new NotFoundException('Payment entry not found');

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

  async remove(id: string, companyId: string) {
    const entry = await this.prisma.paymentEntry.findFirst({
      where: { id, bookings: { companyId } },
    });
    if (!entry) throw new NotFoundException('Payment entry not found');

    return this.prisma.paymentEntry.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
