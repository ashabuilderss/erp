import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../config/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { QueryBookingDto } from './dto/query-booking.dto';
import { BookingStatus, PaymentStatus, Prisma } from '@prisma/client';
import { safeSortBy } from '../../../common/utils/sort-by';

const ALLOWED_SORT = [
  'createdAt',
  'updatedAt',
  'bookingDate',
  'amount',
  'status',
  'paymentStatus',
] as const;

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateBookingDto, companyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
    });

    if (!property) {
      throw new NotFoundException(
        `Property with ID ${dto.propertyId} not found`,
      );
    }

    if (property.status === 'SOLD') {
      throw new BadRequestException(
        'Cannot book a property that is already sold',
      );
    }

    const activeBooking = await this.prisma.booking.findFirst({
      where: {
        propertyId: dto.propertyId,
        status: 'CONFIRMED',
      },
    });

    if (activeBooking) {
      throw new BadRequestException(
        'Property already has an active confirmed booking',
      );
    }

    if (property.status === 'BOOKED') {
      throw new BadRequestException(
        'Cannot book a property that is already booked',
      );
    }

    const booking = await this.prisma.$transaction(async (tx) => {
      const b = await tx.booking.create({
        data: {
          ...dto,
          companyId,
          bookingDate: new Date(dto.bookingDate),
          amount: new Prisma.Decimal(dto.amount),
        },
        include: {
          property: true,
          customer: true,
          lead: true,
          assignedTo: {
            include: { user: true },
          },
        },
      });

      if (dto.status === 'CONFIRMED') {
        await tx.property.update({
          where: { id: dto.propertyId },
          data: { status: 'BOOKED' },
        });
      }

      return b;
    });
    this.eventEmitter.emit('booking.created', {
      companyId,
      entityId: booking.id,
    });
    return booking;
  }

  async findAll(query: QueryBookingDto, companyId: string) {
    const {
      page = 1,
      limit = 10,
      search,
      propertyId,
      customerId,
      leadId,
      status,
      paymentStatus,
      bookingDateFrom,
      bookingDateTo,
      assignedToEmployeeId,
      sortBy = 'bookingDate',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.BookingWhereInput = { companyId };

    if (search) {
      where.OR = [
        { property: { title: { contains: search, mode: 'insensitive' } } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (propertyId) where.propertyId = propertyId;
    if (customerId) where.customerId = customerId;
    if (leadId) where.leadId = leadId;
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (assignedToEmployeeId) where.assignedToEmployeeId = assignedToEmployeeId;
    if (bookingDateFrom || bookingDateTo) {
      where.bookingDate = {};
      if (bookingDateFrom) where.bookingDate.gte = new Date(bookingDateFrom);
      if (bookingDateTo) where.bookingDate.lte = new Date(bookingDateTo);
    }

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        orderBy: {
          [safeSortBy(sortBy, ALLOWED_SORT, 'bookingDate')]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          property: true,
          customer: true,
          lead: true,
          assignedTo: {
            include: { user: true },
          },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, companyId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id, companyId },
      include: {
        property: true,
        customer: true,
        lead: true,
        assignedTo: {
          include: { user: true },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    return booking;
  }

  async update(id: string, dto: UpdateBookingDto, companyId: string) {
    const existing = await this.findOne(id, companyId);

    const data: Prisma.BookingUpdateInput = { ...dto };

    if (dto.bookingDate) {
      data.bookingDate = new Date(dto.bookingDate);
    }
    if (dto.amount !== undefined) {
      data.amount = new Prisma.Decimal(dto.amount);
    }

    let result;

    if (dto.status === 'CONFIRMED' && existing.propertyId) {
      result = await this.prisma.$transaction(async (tx) => {
        await tx.property.update({
          where: { id: existing.propertyId },
          data: { status: 'BOOKED' },
        });
        return tx.booking.update({
          where: { id },
          data,
          include: {
            property: true,
            customer: true,
            lead: true,
            assignedTo: {
              include: { user: true },
            },
          },
        });
      });
    } else {
      result = await this.prisma.booking.update({
        where: { id },
        data,
        include: {
          property: true,
          customer: true,
          lead: true,
          assignedTo: {
            include: { user: true },
          },
        },
      });
    }

    this.eventEmitter.emit('booking.updated', { companyId, entityId: id });
    return result;
  }

  async updateStatus(id: string, status: BookingStatus, companyId: string) {
    const booking = await this.findOne(id, companyId);

    const validTransitions: Record<BookingStatus, BookingStatus[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['CANCELLED', 'PENDING'],
      CANCELLED: ['PENDING'],
    };

    const allowed = validTransitions[booking.status] || [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Invalid status transition from ${booking.status} to ${status}`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (status === 'CONFIRMED' && booking.propertyId) {
        await tx.property.update({
          where: { id: booking.propertyId },
          data: { status: 'BOOKED' },
        });
      }

      if (status === 'CANCELLED' && booking.propertyId) {
        const property = await tx.property.findUnique({
          where: { id: booking.propertyId },
        });
        if (property?.status === 'BOOKED') {
          const otherActive = await tx.booking.count({
            where: {
              propertyId: booking.propertyId,
              status: 'CONFIRMED',
              id: { not: id },
            },
          });
          if (otherActive === 0) {
            await tx.property.update({
              where: { id: booking.propertyId },
              data: { status: 'AVAILABLE' },
            });
          }
        }
      }

      return tx.booking.update({
        where: { id },
        data: { status },
        include: {
          property: true,
          customer: true,
          lead: true,
          assignedTo: {
            include: { user: true },
          },
        },
      });
    });
    this.eventEmitter.emit('booking.updated', { companyId, entityId: id });
    return updated;
  }

  async updatePaymentStatus(
    id: string,
    paymentStatus: PaymentStatus,
    companyId: string,
  ) {
    const booking = await this.findOne(id, companyId);

    const updated = await this.prisma.$transaction(async (tx) => {
      if (paymentStatus === 'COMPLETED' && booking.propertyId) {
        await tx.property.update({
          where: { id: booking.propertyId },
          data: { status: 'SOLD' },
        });
      }

      return tx.booking.update({
        where: { id },
        data: { paymentStatus },
        include: {
          property: true,
          customer: true,
          lead: true,
          assignedTo: {
            include: { user: true },
          },
        },
      });
    });
    this.eventEmitter.emit('booking.updated', { companyId, entityId: id });
    return updated;
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    await this.prisma.booking.delete({ where: { id } });
    this.eventEmitter.emit('booking.deleted', { companyId, entityId: id });
  }
}
