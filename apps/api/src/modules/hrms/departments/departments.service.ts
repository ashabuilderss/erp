import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../config/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { QueryDepartmentDto } from './dto/query-department.dto';
import { Prisma } from '@prisma/client';
import { safeSortBy } from '../../../common/utils/sort-by';

const ALLOWED_SORT = ['createdAt', 'updatedAt', 'name'] as const;

@Injectable()
export class DepartmentsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateDepartmentDto, companyId: string) {
    const department = await this.prisma.department.create({
      data: { ...dto, companyId },
    });
    this.eventEmitter.emit('department.created', {
      companyId,
      entityId: department.id,
    });
    return department;
  }

  async findAll(query: QueryDepartmentDto, companyId: string) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.DepartmentWhereInput = { companyId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.department.findMany({
        where,
        orderBy: { [safeSortBy(sortBy, ALLOWED_SORT, 'createdAt')]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          designations: true,
          _count: { select: { employees: true } },
        },
      }),
      this.prisma.department.count({ where }),
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
    const department = await this.prisma.department.findFirst({
      where: { id, companyId },
      include: {
        designations: true,
        employees: { include: { user: true, designation: true } },
        _count: { select: { employees: true } },
      },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return department;
  }

  async update(id: string, dto: UpdateDepartmentDto, companyId: string) {
    await this.findOne(id, companyId);
    const updated = await this.prisma.department.update({
      where: { id },
      data: dto,
      include: {
        designations: true,
        _count: { select: { employees: true } },
      },
    });
    this.eventEmitter.emit('department.updated', { companyId, entityId: id });
    return updated;
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    await this.prisma.department.delete({ where: { id } });
    this.eventEmitter.emit('department.deleted', { companyId, entityId: id });
  }
}
