import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { QueryAssignmentDto } from './dto/query-assignment.dto';
import { Prisma, AssignmentType } from '@prisma/client';
import { safeSortBy } from '../../../common/utils/sort-by';

const ALLOWED_SORT = [
  'createdAt',
  'updatedAt',
  'startDate',
  'endDate',
  'type',
] as const;

@Injectable()
export class AssignmentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAssignmentDto, companyId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
    });
    if (!employee)
      throw new BadRequestException(
        `Employee with ID ${dto.employeeId} not found`,
      );
    if (employee.companyId !== companyId)
      throw new BadRequestException(
        `Employee with ID ${dto.employeeId} does not belong to this company`,
      );

    const entityExists = await this.validateEntity(
      dto.type,
      dto.entityId,
      companyId,
    );
    if (!entityExists)
      throw new BadRequestException(
        `${dto.type} with ID ${dto.entityId} not found`,
      );

    return this.prisma.employeeAssignment.create({
      data: {
        employeeId: dto.employeeId,
        companyId,
        type: dto.type,
        entityId: dto.entityId,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        notes: dto.notes,
      },
      include: { employee: { include: { user: true, department: true } } },
    });
  }

  async findAll(query: QueryAssignmentDto, companyId: string) {
    const {
      page = 1,
      limit = 10,
      employeeId,
      type,
      entityId,
      startDateFrom,
      endDateTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.EmployeeAssignmentWhereInput = { companyId };

    if (employeeId) where.employeeId = employeeId;
    if (type) where.type = type;
    if (entityId) where.entityId = entityId;
    if (startDateFrom || endDateTo) {
      where.startDate = {};
      if (startDateFrom) where.startDate.gte = new Date(startDateFrom);
      if (endDateTo) where.startDate.lte = new Date(endDateTo);
    }
    if (search) {
      where.OR = [
        { notes: { contains: search, mode: 'insensitive' } },
        {
          employee: { employeeCode: { contains: search, mode: 'insensitive' } },
        },
        {
          employee: {
            user: { firstName: { contains: search, mode: 'insensitive' } },
          },
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.employeeAssignment.findMany({
        where,
        orderBy: { [safeSortBy(sortBy, ALLOWED_SORT, 'createdAt')]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: { employee: { include: { user: true, department: true } } },
      }),
      this.prisma.employeeAssignment.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, companyId: string) {
    const assignment = await this.prisma.employeeAssignment.findFirst({
      where: { id, companyId },
      include: { employee: { include: { user: true, department: true } } },
    });
    if (!assignment)
      throw new NotFoundException(`Assignment with ID ${id} not found`);
    return assignment;
  }

  async update(id: string, dto: UpdateAssignmentDto, companyId: string) {
    const existing = await this.findOne(id, companyId);

    if (dto.type && dto.entityId) {
      const entityExists = await this.validateEntity(
        dto.type,
        dto.entityId,
        companyId,
      );
      if (!entityExists)
        throw new BadRequestException(
          `${dto.type} with ID ${dto.entityId} not found`,
        );
    } else if (dto.type) {
      const entityExists = await this.validateEntity(
        dto.type,
        existing.entityId,
        companyId,
      );
      if (!entityExists)
        throw new BadRequestException(
          `${dto.type} with ID ${existing.entityId} not found`,
        );
    } else if (dto.entityId) {
      const entityExists = await this.validateEntity(
        existing.type,
        dto.entityId,
        companyId,
      );
      if (!entityExists)
        throw new BadRequestException(
          `${existing.type} with ID ${dto.entityId} not found`,
        );
    }

    const data: Prisma.EmployeeAssignmentUpdateInput = { ...dto };
    if (dto.startDate !== undefined)
      data.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.endDate !== undefined)
      data.endDate = dto.endDate ? new Date(dto.endDate) : null;

    return this.prisma.employeeAssignment.update({
      where: { id },
      data,
      include: { employee: { include: { user: true } } },
    });
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.employeeAssignment.delete({ where: { id } });
  }

  async getAssignmentsByEmployee(employeeId: string, companyId: string) {
    return this.prisma.employeeAssignment.findMany({
      where: { employeeId, companyId },
      include: { employee: { include: { user: true } } },
    });
  }

  private async validateEntity(
    type: AssignmentType,
    entityId: string,
    companyId: string,
  ): Promise<boolean> {
    switch (type) {
      case AssignmentType.PROPERTY:
        return !!(await this.prisma.property.findFirst({
          where: { id: entityId, companyId },
        }));
      case AssignmentType.LEAD:
        return !!(await this.prisma.lead.findFirst({
          where: { id: entityId, companyId },
        }));
      case AssignmentType.SITE_VISIT:
        return !!(await this.prisma.siteVisit.findFirst({
          where: { id: entityId, companyId },
        }));
      case AssignmentType.BOOKING:
        return !!(await this.prisma.booking.findFirst({
          where: { id: entityId, companyId },
        }));
      default:
        return false;
    }
  }
}
