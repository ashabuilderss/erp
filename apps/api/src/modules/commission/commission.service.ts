import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateCommissionDto } from './dto/create-commission.dto';
import { QueryCommissionDto } from './dto/query-commission.dto';
import { CommissionStatus } from '@prisma/client';

@Injectable()
export class CommissionService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCommissionDto, companyId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, companyId },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found in this company');
    }
    return this.prisma.pipelineCommission.create({
      data: { ...dto, companyId },
    });
  }

  async findAll(query: QueryCommissionDto, companyId: string) {
    const { page = 1, limit = 20, status, employeeId } = query;
    const where: any = { companyId };
    if (status) where.status = status;
    if (employeeId) where.employeeId = employeeId;

    const data = await this.prisma.pipelineCommission.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    const total = await this.prisma.pipelineCommission.count({ where });

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, companyId: string) {
    const item = await this.prisma.pipelineCommission.findFirst({
      where: { id, companyId },
    });
    if (!item) throw new NotFoundException('Commission not found');
    return item;
  }

  async updateStatus(id: string, status: CommissionStatus, companyId: string) {
    await this.findOne(id, companyId);
    const data: any = { status };
    if (status === 'PAID') data.paidAt = new Date();
    return this.prisma.pipelineCommission.update({ where: { id }, data });
  }
}
