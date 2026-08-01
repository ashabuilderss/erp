import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../config/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { Prisma } from '@prisma/client';
import { safeSortBy } from '../../../common/utils/sort-by';

const ALLOWED_SORT = [
  'createdAt',
  'updatedAt',
  'name',
  'email',
  'type',
] as const;

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateCustomerDto, userId: string, companyId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
    });

    const customer = await this.prisma.customer.create({
      data: {
        ...dto,
        companyId,
        createdById: employee?.id ?? null,
      },
      include: {
        employees: {
          include: { users: true },
        },
      },
    });
    this.eventEmitter.emit('customer.created', {
      companyId,
      entityId: customer.id,
    });
    return customer;
  }

  async findAll(query: QueryCustomerDto, companyId: string) {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      createdById,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.CustomerWhereInput = { companyId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) where.type = type;
    if (createdById) where.createdById = createdById;

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        orderBy: { [safeSortBy(sortBy, ALLOWED_SORT, 'createdAt')]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          employees: {
            include: { users: true },
          },
        },
      }),
      this.prisma.customer.count({ where }),
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
    const customer = await this.prisma.customer.findFirst({
      where: { id, companyId },
      include: {
        employees: {
          include: { users: true },
        },
        leads: true,
        siteVisits: true,
        bookings: true,
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto, companyId: string) {
    await this.findOne(id, companyId);

    const updated = await this.prisma.customer.update({
      where: { id },
      data: dto,
      include: {
        employees: {
          include: { users: true },
        },
      },
    });
    this.eventEmitter.emit('customer.updated', { companyId, entityId: id });
    return updated;
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    await this.prisma.customer.update({ where: { id }, data: { deletedAt: new Date() } });
    this.eventEmitter.emit('customer.deleted', { companyId, entityId: id });
    return { success: true };
  }
}
