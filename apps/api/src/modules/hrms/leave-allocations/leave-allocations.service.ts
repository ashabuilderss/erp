import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import { CreateLeaveAllocationDto } from './dto/create-leave-allocation.dto';
import { UpdateLeaveAllocationDto } from './dto/update-leave-allocation.dto';
import { QueryLeaveAllocationDto } from './dto/query-leave-allocation.dto';
import { Prisma } from '@prisma/client';
import { safeSortBy } from '../../../common/utils/sort-by';

const ALLOWED_SORT = [
  'createdAt',
  'updatedAt',
  'year',
  'totalDays',
  'usedDays',
  'leaveType',
] as const;

@Injectable()
export class LeaveAllocationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateLeaveAllocationDto, companyId: string) {
    return this.prisma.leaveAllocation.create({
      data: { ...dto, companyId },
      include: { employees: { include: { users: true } } },
    });
  }

  async findAll(query: QueryLeaveAllocationDto, companyId: string) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      leaveType,
      year,
      employeeId,
    } = query;

    const where: Prisma.LeaveAllocationWhereInput = { companyId };

    if (leaveType) where.leaveType = leaveType;
    if (year) where.year = year;
    if (employeeId) where.employeeId = employeeId;
    if (search) {
      where.OR = [
        {
          employees: {
            employeeCode: { contains: search, mode: 'insensitive' },
          },
        },
        {
          employees: {
            users: { firstName: { contains: search, mode: 'insensitive' } },
          },
        },
        {
          employees: {
            users: { lastName: { contains: search, mode: 'insensitive' } },
          },
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.leaveAllocation.findMany({
        where,
        orderBy: { [safeSortBy(sortBy, ALLOWED_SORT, 'createdAt')]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          employees: { include: { users: true, departments: true } },
        },
      }),
      this.prisma.leaveAllocation.count({ where }),
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

  async findEmployeeBalance(
    employeeId: string,
    companyId: string,
    year?: number,
  ) {
    const targetYear = year || new Date().getFullYear();
    const allocations = await this.prisma.leaveAllocation.findMany({
      where: { employeeId, companyId, year: targetYear },
    });
    return allocations.map((a) => ({
      leaveType: a.leaveType,
      totalDays: a.totalDays,
      usedDays: a.usedDays,
      remainingDays: a.totalDays - a.usedDays,
    }));
  }

  async findOne(id: string, companyId: string) {
    const record = await this.prisma.leaveAllocation.findFirst({
      where: { id, companyId },
      include: { employees: { include: { users: true, departments: true } } },
    });
    if (!record) throw new NotFoundException('Leave allocation not found');
    return record;
  }

  async update(id: string, dto: UpdateLeaveAllocationDto, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.leaveAllocation.update({
      where: { id },
      data: dto,
      include: { employees: { include: { users: true } } },
    });
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.leaveAllocation.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
