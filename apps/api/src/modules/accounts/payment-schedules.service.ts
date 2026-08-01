import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import {
  CreatePaymentScheduleDto,
  UpdatePaymentScheduleDto,
} from './dto/create-payment-schedule.dto';

@Injectable()
export class PaymentSchedulesService {
  constructor(private prisma: PrismaService) {}

  async findByBooking(bookingId: string, companyId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, companyId },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    return this.prisma.paymentSchedule.findMany({
      where: { bookingId },
      orderBy: { installmentNumber: 'asc' },
    });
  }

  async create(
    bookingId: string,
    dto: CreatePaymentScheduleDto,
    companyId: string,
  ) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, companyId },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.status === 'CANCELLED') {
      throw new BadRequestException(
        'Cannot create payment schedule for a cancelled booking',
      );
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

  async update(id: string, dto: UpdatePaymentScheduleDto, companyId: string) {
    const schedule = await this.prisma.paymentSchedule.findFirst({
      where: { id, bookings: { companyId } },
    });
    if (!schedule) throw new NotFoundException('Payment schedule not found');

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

  private async syncBookingPaymentStatus(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { amount: true, paymentStatus: true },
    });
    if (!booking) return;

    const schedules = await this.prisma.paymentSchedule.findMany({
      where: { bookingId },
      select: { amount: true, status: true },
    });

    const totalScheduled = schedules.reduce(
      (sum, s) => sum + Number(s.amount),
      0,
    );
    const totalPaid = schedules
      .filter((s) => s.status === 'PAID')
      .reduce((sum, s) => sum + Number(s.amount), 0);

    let newPaymentStatus: 'PENDING' | 'PARTIAL' | 'COMPLETED' = 'PENDING';
    if (totalPaid >= Number(booking.amount) || totalPaid >= totalScheduled) {
      newPaymentStatus = 'COMPLETED';
    } else if (totalPaid > 0) {
      newPaymentStatus = 'PARTIAL';
    }

    if (newPaymentStatus !== booking.paymentStatus) {
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: { paymentStatus: newPaymentStatus },
      });
    }
  }

  async remove(id: string, companyId: string) {
    const schedule = await this.prisma.paymentSchedule.findFirst({
      where: { id, bookings: { companyId } },
    });
    if (!schedule) throw new NotFoundException('Payment schedule not found');

    return this.prisma.paymentSchedule.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
