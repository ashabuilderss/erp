import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../config/prisma.service';
import { CreateBrokerDto } from './dto/create-broker.dto';
import { UpdateBrokerDto } from './dto/update-broker.dto';
import { QueryBrokerDto } from './dto/query-broker.dto';
import { Prisma } from '@prisma/client';
import { safeSortBy } from '../../../common/utils/sort-by';

const ALLOWED_SORT = [
  'createdAt',
  'updatedAt',
  'name',
  'email',
  'companyName',
] as const;

@Injectable()
export class BrokersService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateBrokerDto, companyId: string) {
    if (dto.email) {
      const existing = await this.prisma.broker.findFirst({
        where: { companyId, email: dto.email, deletedAt: null },
      });
      if (existing) {
        throw new ConflictException('A broker with this email already exists');
      }
    }

    const broker = await this.prisma.broker.create({
      data: {
        companyId,
        name: dto.name,
        companyName: dto.companyName,
        phone: dto.phone,
        email: dto.email,
        commissionRate: dto.commissionRate,
        isActive: dto.isActive ?? true,
      },
    });

    this.eventEmitter.emit('broker.created', { companyId, entityId: broker.id });
    return broker;
  }

  async findAll(query: QueryBrokerDto, companyId: string) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive,
    } = query;

    const where: Prisma.BrokerWhereInput = { companyId, deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.broker.findMany({
        where,
        orderBy: { [safeSortBy(sortBy, ALLOWED_SORT, 'createdAt')]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.broker.count({ where }),
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
    const broker = await this.prisma.broker.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { leads: true },
    });

    if (!broker) {
      throw new NotFoundException(`Broker with ID ${id} not found`);
    }

    return broker;
  }

  async update(id: string, dto: UpdateBrokerDto, companyId: string) {
    await this.findOne(id, companyId);

    if (dto.email) {
      const existing = await this.prisma.broker.findFirst({
        where: { companyId, email: dto.email, deletedAt: null, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('A broker with this email already exists');
      }
    }

    const updated = await this.prisma.broker.update({
      where: { id },
      data: dto,
    });

    this.eventEmitter.emit('broker.updated', { companyId, entityId: id });
    return updated;
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    await this.prisma.broker.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    this.eventEmitter.emit('broker.deleted', { companyId, entityId: id });
    return { success: true };
  }
}
