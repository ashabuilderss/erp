import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../config/prisma.service';
import { TransitionService } from '../../../common/services/transition.service';
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
    private transitionService: TransitionService,
  ) {}

  async create(dto: CreateBookingDto, companyId: string, currentUserRole?: string, currentEmployeeId?: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: dto.propertyId, companyId },
    });

    if (!property) {
      throw new NotFoundException(
        `Property with ID ${dto.propertyId} not found`,
      );
    }

    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, companyId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${dto.customerId} not found`);
    }

    const assignedEmployee = await this.prisma.employee.findFirst({
      where: {
        id: dto.assignedToEmployeeId,
        companyId,
      },
    });
    if (!assignedEmployee) {
      throw new NotFoundException('Assigned employee not found');
    }

    if (dto.leadId) {
      const lead = await this.prisma.lead.findFirst({
        where: { id: dto.leadId, companyId },
      });
      if (!lead) {
        throw new NotFoundException(`Lead with ID ${dto.leadId} not found`);
      }
    }

    if (currentUserRole === 'EMPLOYEE' && dto.assignedToEmployeeId !== currentEmployeeId) {
      throw new BadRequestException('Employees can only create bookings assigned to themselves');
    }

    const booking = await this.prisma.$transaction(async (tx) => {
      const currentProperty = await tx.property.findUnique({
        where: { id: dto.propertyId },
      });

      if (currentProperty?.status === 'SOLD') {
        throw new BadRequestException(
          'Cannot book a property that is already sold',
        );
      }

      const activeBooking = await tx.booking.findFirst({
        where: {
          propertyId: dto.propertyId,
          companyId,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      });

      if (activeBooking) {
        throw new BadRequestException(
          'Property already has an active booking',
        );
      }

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

  async findAll(
    query: QueryBookingDto,
    companyId: string,
    myEmployeeId?: string,
  ) {
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
    if (myEmployeeId) {
      where.assignedToEmployeeId = myEmployeeId;
    } else if (assignedToEmployeeId) {
      where.assignedToEmployeeId = assignedToEmployeeId;
    }
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

  async findOne(id: string, companyId: string, employeeId?: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id, companyId, ...(employeeId && { assignedToEmployeeId: employeeId }) },
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

  async update(id: string, dto: UpdateBookingDto, companyId: string, employeeId?: string, currentUserRole?: string, currentEmployeeId?: string) {
    const existing = await this.findOne(id, companyId, employeeId);

    if (dto.assignedToEmployeeId !== undefined && dto.assignedToEmployeeId !== existing.assignedToEmployeeId) {
      if (dto.assignedToEmployeeId) {
        const assigned = await this.prisma.employee.findFirst({
          where: { id: dto.assignedToEmployeeId, companyId },
        });
        if (!assigned) {
          throw new BadRequestException('Assigned employee not found in your company');
        }
      }
      if (currentUserRole === 'EMPLOYEE') {
        throw new BadRequestException('Employees cannot reassign bookings');
      }
    }

    if (dto.propertyId !== undefined && dto.propertyId !== existing.propertyId) {
      const property = await this.prisma.property.findFirst({
        where: { id: dto.propertyId, companyId },
      });
      if (!property) {
        throw new BadRequestException('Property not found in your company');
      }
    }

    if (dto.customerId !== undefined && dto.customerId !== existing.customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: dto.customerId, companyId },
      });
      if (!customer) {
        throw new BadRequestException('Customer not found in your company');
      }
    }

    if (dto.leadId !== undefined && dto.leadId !== existing.leadId) {
      const lead = await this.prisma.lead.findFirst({
        where: { id: dto.leadId, companyId },
      });
      if (!lead) {
        throw new BadRequestException('Lead not found in your company');
      }
    }

    const data: Prisma.BookingUpdateInput = { ...dto };

    if (dto.bookingDate) {
      data.bookingDate = new Date(dto.bookingDate);
    }
    if (dto.amount !== undefined) {
      data.amount = new Prisma.Decimal(dto.amount);
    }

    const result = await this.prisma.booking.update({
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

    this.eventEmitter.emit('booking.updated', { companyId, entityId: id });
    return result;
  }

  async updateStatus(id: string, status: BookingStatus, companyId: string, employeeId?: string, currentUserRole?: string, currentEmployeeId?: string) {
    const updated = await this.transitionService.execute({
      entityType: 'Booking',
      id,
      newStatus: status,
      companyId,
      currentUserRole,
      currentEmployeeId,
      before: async (tx, booking) => {
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
                status: { in: ['PENDING', 'CONFIRMED'] },
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

          await tx.paymentSchedule.updateMany({
            where: { bookingId: id, status: 'PENDING' },
            data: { status: 'CANCELLED' },
          });
        }
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
    this.eventEmitter.emit('booking.updated', { companyId, entityId: id });
    return updated;
  }

  async updatePaymentStatus(
    id: string,
    paymentStatus: PaymentStatus,
    companyId: string,
    employeeId?: string,
    currentUserRole?: string,
    currentEmployeeId?: string,
  ) {
    const booking = await this.findOne(id, companyId, employeeId);

    if (currentUserRole === 'EMPLOYEE' && booking.assignedToEmployeeId !== currentEmployeeId) {
      throw new BadRequestException('Employees can only update payment status of their own bookings');
    }

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
    const booking = await this.findOne(id, companyId);

    await this.prisma.$transaction(async (tx) => {
      if (booking.propertyId) {
        const property = await tx.property.findUnique({
          where: { id: booking.propertyId },
        });
        if (property?.status === 'BOOKED') {
          const otherActive = await tx.booking.count({
            where: {
              propertyId: booking.propertyId,
              status: { in: ['PENDING', 'CONFIRMED'] },
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

      await tx.paymentSchedule.updateMany({
        where: { bookingId: id, status: 'PENDING' },
        data: { status: 'CANCELLED' },
      });

      await tx.booking.delete({ where: { id } });
    });

    this.eventEmitter.emit('booking.deleted', { companyId, entityId: id });
  }
}
