import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
      throw new BadRequestException('Cannot create payment schedule for a cancelled booking');
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
      where: { id, booking: { companyId } },
    });
    if (!schedule) throw new NotFoundException('Payment schedule not found');

    return this.prisma.paymentSchedule.update({
      where: { id },
      data: {
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.dueDate !== undefined && { dueDate: new Date(dto.dueDate) }),
        ...(dto.paidDate !== undefined && { paidDate: new Date(dto.paidDate) }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
  }

  async remove(id: string, companyId: string) {
    const schedule = await this.prisma.paymentSchedule.findFirst({
      where: { id, booking: { companyId } },
    });
    if (!schedule) throw new NotFoundException('Payment schedule not found');

    return this.prisma.paymentSchedule.delete({ where: { id } });
  }
}
