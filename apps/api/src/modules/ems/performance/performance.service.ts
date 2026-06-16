import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import { CreatePerformanceDto } from './dto/create-performance.dto';
import { UpdatePerformanceDto } from './dto/update-performance.dto';
import { QueryPerformanceDto } from './dto/query-performance.dto';
import { Prisma } from '@prisma/client';
import { safeSortBy } from '../../../common/utils/sort-by';

const ALLOWED_SORT = [
  'createdAt',
  'updatedAt',
  'year',
  'quarter',
  'score',
] as const;

@Injectable()
export class PerformanceService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePerformanceDto, companyId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
    });
    if (!employee)
      throw new BadRequestException(
        `Employee with ID ${dto.employeeId} not found`,
      );

    const existing = await this.prisma.performance.findUnique({
      where: {
        employeeId_year_quarter: {
          employeeId: dto.employeeId,
          year: dto.year,
          quarter: dto.quarter,
        },
      },
    });
    if (existing)
      throw new BadRequestException(
        `Performance for employee ${dto.employeeId} in Q${dto.quarter} ${dto.year} already exists`,
      );

    return this.prisma.performance.create({
      data: { ...dto, companyId },
      include: { employee: { include: { user: true, department: true } } },
    });
  }

  async findAll(query: QueryPerformanceDto, companyId: string) {
    const {
      page = 1,
      limit = 10,
      employeeId,
      year,
      quarter,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.PerformanceWhereInput = { companyId };

    if (employeeId) where.employeeId = employeeId;
    if (year) where.year = year;
    if (quarter) where.quarter = quarter;
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
      this.prisma.performance.findMany({
        where,
        orderBy: { [safeSortBy(sortBy, ALLOWED_SORT, 'createdAt')]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: { employee: { include: { user: true, department: true } } },
      }),
      this.prisma.performance.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, companyId: string) {
    const performance = await this.prisma.performance.findFirst({
      where: { id, companyId },
      include: { employee: { include: { user: true, department: true } } },
    });
    if (!performance)
      throw new NotFoundException(`Performance with ID ${id} not found`);
    return performance;
  }

  async update(id: string, dto: UpdatePerformanceDto, companyId: string) {
    const existing = await this.findOne(id, companyId);

    if (dto.employeeId || dto.year || dto.quarter) {
      const employeeId = dto.employeeId ?? existing.employeeId;
      const year = dto.year ?? existing.year;
      const quarter = dto.quarter ?? existing.quarter;

      const duplicate = await this.prisma.performance.findFirst({
        where: { employeeId, year, quarter, NOT: { id } },
      });
      if (duplicate)
        throw new BadRequestException(
          `Performance for employee ${employeeId} in Q${quarter} ${year} already exists`,
        );
    }

    return this.prisma.performance.update({
      where: { id },
      data: dto,
      include: { employee: { include: { user: true } } },
    });
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.performance.delete({ where: { id } });
  }

  async getEmployeePerformance(
    employeeId: string,
    companyId: string,
    year?: number,
  ) {
    const where: Prisma.PerformanceWhereInput = { employeeId, companyId };
    if (year) where.year = year;

    return this.prisma.performance.findMany({
      where,
      orderBy: [{ year: 'asc' }, { quarter: 'asc' }],
      include: { employee: { include: { user: true } } },
    });
  }

  async getAverageScore(companyId: string, year?: number, quarter?: number) {
    const where: Prisma.PerformanceWhereInput = { companyId };
    if (year) where.year = year;
    if (quarter) where.quarter = quarter;

    const result = await this.prisma.performance.aggregate({
      where,
      _avg: { score: true },
    });

    return { averageScore: result._avg.score ?? 0 };
  }
}
