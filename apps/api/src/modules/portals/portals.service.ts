import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import {
  CreateBrokerDto,
  QueryBrokerDto,
  CreateComplaintDto,
  UpdateComplaintDto,
  QueryComplaintDto,
} from './dto';

@Injectable()
export class PortalsService {
  constructor(private prisma: PrismaService) {}

  async createBroker(dto: CreateBrokerDto, companyId: string) {
    return this.prisma.broker.create({
      data: { ...dto, companyId },
    });
  }

  async findAllBrokers(query: QueryBrokerDto, companyId: string) {
    const { page = 1, limit = 10, search } = query;

    const where: any = { companyId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.broker.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.broker.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOneBroker(id: string, companyId: string) {
    const broker = await this.prisma.broker.findFirst({
      where: { id, companyId },
      include: { _count: { select: { leads: true } } },
    });

    if (!broker) {
      throw new NotFoundException(`Broker with ID ${id} not found`);
    }

    return broker;
  }

  async updateBroker(
    id: string,
    dto: Partial<CreateBrokerDto>,
    companyId: string,
  ) {
    await this.findOneBroker(id, companyId);

    return this.prisma.broker.update({
      where: { id },
      data: dto,
    });
  }

  async deleteBroker(id: string, companyId: string) {
    await this.findOneBroker(id, companyId);

    return this.prisma.broker.delete({ where: { id } });
  }

  async createComplaint(dto: CreateComplaintDto, companyId: string) {
    return this.prisma.complaint.create({
      data: { ...dto, companyId },
      include: { customer: true, property: true },
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
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.complaint.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { customer: true, property: true },
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
      include: { customer: true, property: true },
    });

    if (!complaint) {
      throw new NotFoundException(`Complaint with ID ${id} not found`);
    }

    return complaint;
  }

  async updateComplaint(id: string, dto: UpdateComplaintDto, companyId: string) {
    await this.findOneComplaint(id, companyId);
    const data: any = { ...dto };
    if (dto.status === 'RESOLVED' || dto.status === 'CLOSED') {
      data.resolvedAt = new Date();
    }
    return this.prisma.complaint.update({
      where: { id },
      data,
      include: { customer: true, property: true },
    });
  }

  async deleteComplaint(id: string, companyId: string) {
    await this.findOneComplaint(id, companyId);
    return this.prisma.complaint.delete({ where: { id } });
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
      include: { customer: true, property: true },
    });
  }
}
