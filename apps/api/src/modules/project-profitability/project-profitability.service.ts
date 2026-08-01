import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import {
  CreateProjectBudgetDto,
  UpdateProjectBudgetDto,
  QueryProjectProfitabilityDto,
} from './dto/create-project-budget.dto';
import { CreateCostEntryDto } from './dto/create-cost-entry.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProjectProfitabilityService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, query: QueryProjectProfitabilityDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectBudgetWhereInput = {
      companyId,
      ...(query.status && { status: query.status }),
      ...(query.search && {
        site: {
          name: { contains: query.search, mode: 'insensitive' },
        },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.projectBudget.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          site: {
            select: { id: true, name: true, status: true },
          },
          _count: { select: { costEntries: true } },
        },
      }),
      this.prisma.projectBudget.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, companyId: string) {
    const budget = await this.prisma.projectBudget.findFirst({
      where: { id, companyId },
      include: {
        site: {
          select: { id: true, name: true, status: true },
        },
        costEntries: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!budget) throw new NotFoundException('Project budget not found');
    return budget;
  }

  async create(dto: CreateProjectBudgetDto, companyId: string) {
    // Check if a budget already exists for this site
    const existing = await this.prisma.projectBudget.findUnique({
      where: { siteId: dto.siteId },
    });
    if (existing) {
      throw new BadRequestException(
        'A budget already exists for this construction site',
      );
    }

    return this.prisma.projectBudget.create({
      data: {
        siteId: dto.siteId,
        companyId,
        budgetAmount: dto.budgetAmount,
        status: 'ACTIVE',
      },
      include: {
        site: {
          select: { id: true, name: true, status: true },
        },
      },
    });
  }

  async update(id: string, dto: UpdateProjectBudgetDto, companyId: string) {
    const existing = await this.prisma.projectBudget.findFirst({
      where: { id, companyId },
    });
    if (!existing) throw new NotFoundException('Project budget not found');

    return this.prisma.projectBudget.update({
      where: { id },
      data: {
        ...(dto.budgetAmount !== undefined && { budgetAmount: dto.budgetAmount }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
  }

  async listCostEntries(id: string, companyId: string) {
    const budget = await this.prisma.projectBudget.findFirst({
      where: { id, companyId },
    });
    if (!budget) throw new NotFoundException('Project budget not found');

    return this.prisma.projectCostEntry.findMany({
      where: { budgetId: id },
      orderBy: { date: 'desc' },
    });
  }

  async addCostEntry(
    budgetId: string,
    dto: CreateCostEntryDto,
    companyId: string,
  ) {
    const budget = await this.prisma.projectBudget.findFirst({
      where: { id: budgetId, companyId },
    });
    if (!budget) throw new NotFoundException('Project budget not found');

    return this.prisma.$transaction(async (tx) => {
      const entry = await tx.projectCostEntry.create({
        data: {
          budgetId,
          category: dto.category,
          amount: dto.amount,
          description: dto.description,
          date: dto.date ? new Date(dto.date) : new Date(),
          companyId,
        },
      });

      // Recalculate actual amount
      const aggregate = await tx.projectCostEntry.aggregate({
        where: { budgetId },
        _sum: { amount: true },
      });
      const totalActual = Number(aggregate._sum.amount ?? 0);

      await tx.projectBudget.update({
        where: { id: budgetId },
        data: { actualAmount: totalActual },
      });

      return entry;
    });
  }

  async deleteCostEntry(entryId: string, companyId: string) {
    const entry = await this.prisma.projectCostEntry.findFirst({
      where: { id: entryId },
      include: { budget: true },
    });
    if (!entry) throw new NotFoundException('Cost entry not found');

    if (entry.budget.companyId !== companyId) {
      throw new NotFoundException('Cost entry not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.projectCostEntry.delete({ where: { id: entryId } });

      // Recalculate actual amount
      const aggregate = await tx.projectCostEntry.aggregate({
        where: { budgetId: entry.budgetId },
        _sum: { amount: true },
      });
      const totalActual = Number(aggregate._sum.amount ?? 0);

      await tx.projectBudget.update({
        where: { id: entry.budgetId },
        data: { actualAmount: totalActual },
      });

      return { deleted: true };
    });
  }

  async getSummary(companyId: string) {
    const budgets = await this.prisma.projectBudget.findMany({
      where: { companyId },
      include: {
        site: { select: { id: true, name: true } },
      },
    });

    const totalBudget = budgets.reduce((sum, b) => sum + Number(b.budgetAmount), 0);
    const totalActual = budgets.reduce((sum, b) => sum + Number(b.actualAmount), 0);
    const totalVariance = totalBudget - totalActual;
    const profitMarginPct =
      totalBudget > 0 ? ((totalVariance / totalBudget) * 100).toFixed(2) : '0.00';

    return {
      totalBudget,
      totalActual,
      totalVariance,
      profitMarginPercent: parseFloat(profitMarginPct),
      projects: budgets.map((b) => ({
        siteId: b.siteId,
        siteName: b.site.name,
        budgetAmount: Number(b.budgetAmount),
        actualAmount: Number(b.actualAmount),
        variance: Number(b.budgetAmount) - Number(b.actualAmount),
        status: b.status,
      })),
    };
  }
}
