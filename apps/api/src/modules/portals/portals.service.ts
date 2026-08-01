import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import {
  CreateComplaintDto,
  UpdateComplaintDto,
  QueryComplaintDto,
} from './dto';

@Injectable()
export class PortalsService {
  constructor(private prisma: PrismaService) {}

  async createComplaint(dto: CreateComplaintDto, companyId: string) {
    return this.prisma.complaint.create({
      data: { ...dto, companyId },
      include: { customers: true, properties: true },
    });
  }

  async findAllComplaints(query: QueryComplaintDto, companyId: string) {
    const { page = 1, limit = 10, status, customerId, search } = query;

    const where: any = { companyId };

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { customers: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.complaint.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { customers: true, properties: true },
      }),
      this.prisma.complaint.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOneComplaint(id: string, companyId: string) {
    const complaint = await this.prisma.complaint.findFirst({
      where: { id, companyId },
      include: { customers: true, properties: true },
    });

    if (!complaint) {
      throw new NotFoundException(`Complaint with ID ${id} not found`);
    }

    return complaint;
  }

  async updateComplaint(
    id: string,
    dto: UpdateComplaintDto,
    companyId: string,
  ) {
    await this.findOneComplaint(id, companyId);
    const data: any = { ...dto };
    if (dto.status === 'RESOLVED' || dto.status === 'CLOSED') {
      data.resolvedAt = new Date();
    }
    return this.prisma.complaint.update({
      where: { id },
      data,
      include: { customers: true, properties: true },
    });
  }

  async deleteComplaint(id: string, companyId: string) {
    await this.findOneComplaint(id, companyId);
    return this.prisma.complaint.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async resolveComplaint(id: string, resolution: string, companyId: string) {
    await this.findOneComplaint(id, companyId);

    return this.prisma.complaint.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolution,
        resolvedAt: new Date(),
      },
      include: { customers: true, properties: true },
    });
  }
}
