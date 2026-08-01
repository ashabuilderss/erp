import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import { CreateChartOfAccountDto } from './dto/create-chart-of-account.dto';
import { UpdateChartOfAccountDto } from './dto/update-chart-of-account.dto';
import { QueryChartOfAccountDto } from './dto/query-chart-of-account.dto';

@Injectable()
export class ChartOfAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateChartOfAccountDto, companyId: string) {
    const existing = await this.prisma.chartOfAccount.findUnique({
      where: { companyId_code: { companyId, code: dto.code } },
    });
    if (existing) {
      throw new ConflictException(`Account code ${dto.code} already exists`);
    }
    return this.prisma.chartOfAccount.create({
      data: { ...dto, companyId },
    });
  }

  async findAll(dto: QueryChartOfAccountDto, companyId: string) {
    const page = parseInt(dto.page || '1', 10);
    const limit = parseInt(dto.limit || '50', 10);
    const skip = (page - 1) * limit;

    const where: any = { companyId };
    if (dto.type) where.type = dto.type;
    if (dto.search) {
      where.OR = [
        { name: { contains: dto.search, mode: 'insensitive' } },
        { code: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.chartOfAccount.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: 'asc' },
        include: { parent: { select: { id: true, code: true, name: true } } },
      }),
      this.prisma.chartOfAccount.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: string, companyId: string) {
    const account = await this.prisma.chartOfAccount.findFirst({
      where: { id, companyId },
      include: {
        parent: { select: { id: true, code: true, name: true } },
        children: { select: { id: true, code: true, name: true, type: true } },
      },
    });
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  async update(id: string, dto: UpdateChartOfAccountDto, companyId: string) {
    await this.findOne(id, companyId);
    const payload = dto as any;
    if (payload.code) {
      const existing = await this.prisma.chartOfAccount.findUnique({
        where: { companyId_code: { companyId, code: payload.code } },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Account code ${payload.code} already exists`);
      }
    }
    return this.prisma.chartOfAccount.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    const childrenCount = await this.prisma.chartOfAccount.count({
      where: { parentId: id },
    });
    if (childrenCount > 0) {
      throw new ConflictException('Cannot delete account with child accounts');
    }
    await this.prisma.chartOfAccount.delete({ where: { id } });
    return { deleted: true };
  }
}
