import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import type { Prisma } from '@prisma/client';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.company.findMany({
      where: { id: companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async update(id: string, dto: UpdateCompanyDto) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');
    const data: Prisma.CompanyUpdateInput = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.slug !== undefined && { slug: dto.slug }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.settings !== undefined && {
        settings: dto.settings as Prisma.InputJsonValue,
      }),
    };
    return this.prisma.company.update({ where: { id }, data });
  }
}
