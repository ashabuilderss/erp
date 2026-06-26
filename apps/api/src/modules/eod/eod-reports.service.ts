import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import {
  CreateEodReportDto,
  UpdateEodReportDto,
} from './dto/create-eod-report.dto';

@Injectable()
export class EodReportsService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, date?: string, employeeId?: string) {
    return this.prisma.eodReport.findMany({
      where: {
        companyId,
        ...(date && { reportDate: new Date(date) }),
        ...(employeeId && { employeeId }),
      },
      orderBy: { reportDate: 'desc' },
      include: {
        employee: { select: { employeeCode: true } },
        reviewedBy: { select: { employeeCode: true } },
      },
    });
  }

  async findByEmployee(employeeId: string, companyId: string, date?: string) {
    return this.prisma.eodReport.findMany({
      where: {
        employeeId,
        companyId,
        ...(date && { reportDate: new Date(date) }),
      },
      orderBy: { reportDate: 'desc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const report = await this.prisma.eodReport.findFirst({
      where: { id, companyId },
      include: {
        employee: { select: { employeeCode: true } },
        reviewedBy: { select: { employeeCode: true } },
      },
    });
    if (!report) throw new NotFoundException('EOD report not found');
    return report;
  }

  async create(dto: CreateEodReportDto, employeeId: string, companyId: string) {
    return this.prisma.eodReport.create({
      data: {
        employeeId,
        companyId,
        reportDate: new Date(dto.reportDate),
        accomplishments: dto.accomplishments,
        challenges: dto.challenges,
        tomorrowPlan: dto.tomorrowPlan,
      },
    });
  }

  async update(id: string, dto: UpdateEodReportDto, companyId: string) {
    const report = await this.prisma.eodReport.findFirst({
      where: { id, companyId },
    });
    if (!report) throw new NotFoundException('EOD report not found');

    return this.prisma.eodReport.update({
      where: { id },
      data: {
        ...(dto.accomplishments !== undefined && {
          accomplishments: dto.accomplishments,
        }),
        ...(dto.challenges !== undefined && { challenges: dto.challenges }),
        ...(dto.tomorrowPlan !== undefined && {
          tomorrowPlan: dto.tomorrowPlan,
        }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
  }

  async review(
    id: string,
    dto: UpdateEodReportDto,
    reviewedById: string,
    companyId: string,
  ) {
    const report = await this.prisma.eodReport.findFirst({
      where: { id, companyId },
    });
    if (!report) throw new NotFoundException('EOD report not found');

    return this.prisma.eodReport.update({
      where: { id },
      data: {
        status: dto.status ?? 'REVIEWED',
        reviewedById,
        reviewedAt: new Date(),
      },
    });
  }
}
