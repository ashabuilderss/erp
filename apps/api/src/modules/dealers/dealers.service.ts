import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateDealerDto, UpdateDealerDto, QueryDealerDto } from './dto';

@Injectable()
export class DealersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDealerDto, companyId: string) {
    return this.prisma.dealer.create({ data: { ...dto, companyId } });
  }

  async findAll(query: QueryDealerDto, companyId: string) {
    const { page = 1, limit = 10, search } = query;
    const where: any = { companyId };
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.dealer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.dealer.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, companyId: string) {
    const dealer = await this.prisma.dealer.findFirst({ where: { id, companyId } });
    if (!dealer) throw new NotFoundException(`Dealer with ID ${id} not found`);
    return dealer;
  }

  async update(id: string, dto: UpdateDealerDto, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.dealer.update({ where: { id }, data: dto });
  }

  async delete(id: string, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.dealer.delete({ where: { id } });
  }
}
