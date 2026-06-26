import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateIncentiveDto } from './dto/create-incentive.dto';
import { UpdateIncentiveDto } from './dto/update-incentive.dto';
import { QueryIncentiveDto } from './dto/query-incentive.dto';

@Injectable()
export class IncentivesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateIncentiveDto, companyId: string) {
    const { payoutStatus, ...rest } = dto;
    return this.prisma.incentive.create({
      data: { ...rest, companyId, payoutStatus: payoutStatus ?? 'PENDING' },
    });
  }

  async findAll(companyId: string, query?: QueryIncentiveDto) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', status, payoutStatus } = query ?? {};

    const where: any = { companyId };
    if (status) where.status = status;
    if (payoutStatus) where.payoutStatus = payoutStatus;

    const [data, total] = await Promise.all([
      this.prisma.incentive.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.incentive.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findActive(companyId: string, query?: QueryIncentiveDto) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query ?? {};

    const where = { companyId, status: 'ACTIVE' as const };

    const [data, total] = await Promise.all([
      this.prisma.incentive.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.incentive.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, companyId: string) {
    const item = await this.prisma.incentive.findFirst({
      where: { id, companyId },
    });
    if (!item) throw new NotFoundException('Incentive not found');
    return item;
  }

  async update(id: string, dto: UpdateIncentiveDto, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.incentive.update({ where: { id }, data: dto });
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.incentive.delete({ where: { id } });
  }

  async leaderboard(companyId: string, employeeId?: string | null) {
    const ownWhere = employeeId ? { assignedToEmployeeId: employeeId } : {};

    const incentivesWon = await this.prisma.incentive.groupBy({
      by: ['winnerId'],
      where: { companyId, winnerId: { not: null }, status: 'CLOSED' },
      _count: { id: true },
      _sum: { value: true },
    });

    const commissions = await this.prisma.pipelineCommission.groupBy({
      by: ['employeeId'],
      where: { companyId, status: 'PAID' },
      _count: { id: true },
      _sum: { amount: true },
    });

    const [leadGroup, bookingGroup] = await Promise.all([
      this.prisma.lead.groupBy({
        by: ['assignedToEmployeeId'],
        where: { companyId, ...ownWhere },
        _count: { id: true },
      }),
      this.prisma.booking.groupBy({
        by: ['assignedToEmployeeId'],
        where: { companyId, ...ownWhere },
        _count: { id: true },
      }),
    ]);

    const leadCounts = leadGroup.filter((l): l is (typeof l & { assignedToEmployeeId: string }) => !!l.assignedToEmployeeId);
    const bookingCounts = bookingGroup.filter((b): b is (typeof b & { assignedToEmployeeId: string }) => !!b.assignedToEmployeeId);

    const winnerIds = [...new Set([
      ...incentivesWon.map((i) => i.winnerId).filter(Boolean),
      ...commissions.map((c) => c.employeeId),
      ...leadCounts.map((l) => l.assignedToEmployeeId),
      ...bookingCounts.map((b) => b.assignedToEmployeeId),
    ])] as string[];

    if (winnerIds.length === 0) return [];

    const employees = await this.prisma.employee.findMany({
      where: { id: { in: winnerIds }, companyId },
      select: {
        id: true, employeeCode: true,
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    const empMap = new Map(employees.map((e) => [e.id, e]));

    const rows = winnerIds.map((id) => {
      const inc = incentivesWon.find((i) => i.winnerId === id);
      const com = commissions.find((c) => c.employeeId === id);
      const leads = leadCounts.find((l) => l.assignedToEmployeeId === id);
      const booking = bookingCounts.find((b) => b.assignedToEmployeeId === id);
      const incentivesScore = (inc?._count?.id ?? 0) * 10;
      const commissionTotal = Number(com?._sum?.amount ?? 0);
      const totalScore = incentivesScore + commissionTotal;
      const emp = empMap.get(id);
      return {
        employeeId: id,
        employeeName: emp?.user
          ? `${emp.user.firstName} ${emp.user.lastName}`
          : 'Unknown',
        employeeCode: emp?.employeeCode ?? '',
        incentivesWon: inc?._count?.id ?? 0,
        incentivesValue: Number(inc?._sum?.value ?? 0),
        commissionsPaid: com?._count?.id ?? 0,
        commissionTotal,
        leadsAssigned: leads?._count?.id ?? 0,
        bookingsHandled: booking?._count?.id ?? 0,
        totalScore,
      };
    });

    rows.sort((a, b) => b.totalScore - a.totalScore);
    return rows;
  }
}
