import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../config/prisma.service';
import { CreateDesignationDto } from './dto/create-designation.dto';
import { UpdateDesignationDto } from './dto/update-designation.dto';
import { QueryDesignationDto } from './dto/query-designation.dto';
import { Prisma } from '@prisma/client';
import { safeSortBy } from '../../../common/utils/sort-by';

const ALLOWED_SORT = ['createdAt', 'updatedAt', 'name'] as const;

@Injectable()
export class DesignationsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateDesignationDto, companyId: string) {
    const department = await this.prisma.department.findUnique({
      where: { id: dto.departmentId },
    });
    if (!department) {
      throw new BadRequestException(
        `Department with ID ${dto.departmentId} not found`,
      );
    }
    if (department.companyId !== companyId) {
      throw new BadRequestException(
        `Department with ID ${dto.departmentId} does not belong to this company`,
      );
    }

    const designation = await this.prisma.designation.create({
      data: { ...dto, companyId },
      include: { department: true },
    });
    this.eventEmitter.emit('designation.created', {
      companyId,
      entityId: designation.id,
    });
    return designation;
  }

  async findAll(query: QueryDesignationDto, companyId: string) {
    const {
      page = 1,
      limit = 10,
      search,
      departmentId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.DesignationWhereInput = { companyId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    const [data, total] = await Promise.all([
      this.prisma.designation.findMany({
        where,
        orderBy: { [safeSortBy(sortBy, ALLOWED_SORT, 'createdAt')]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: { department: true, _count: { select: { employees: true } } },
      }),
      this.prisma.designation.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, companyId: string) {
    const designation = await this.prisma.designation.findFirst({
      where: { id, companyId },
      include: { department: true, employees: { include: { user: true } } },
    });

    if (!designation) {
      throw new NotFoundException(`Designation with ID ${id} not found`);
    }

    return designation;
  }

  async update(id: string, dto: UpdateDesignationDto, companyId: string) {
    await this.findOne(id, companyId);

    if (dto.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: dto.departmentId },
      });
      if (!department) {
        throw new BadRequestException(
          `Department with ID ${dto.departmentId} not found`,
        );
      }
      if (department.companyId !== companyId) {
        throw new BadRequestException(
          `Department with ID ${dto.departmentId} does not belong to this company`,
        );
      }
    }

    const updated = await this.prisma.designation.update({
      where: { id },
      data: dto,
      include: { department: true, _count: { select: { employees: true } } },
    });
    this.eventEmitter.emit('designation.updated', { companyId, entityId: id });
    return updated;
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    await this.prisma.designation.delete({ where: { id } });
    this.eventEmitter.emit('designation.deleted', { companyId, entityId: id });
  }
}
