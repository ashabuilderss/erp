import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateSopDto,
  UpdateSopDto,
  AcknowledgeSopDto,
  QuerySopDto,
} from './dto/create-sop.dto';
import {
  CreateTrainingRecordDto,
  QueryTrainingRecordDto,
} from './dto/create-training-record.dto';

@Injectable()
export class TrainingService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── SOP DOCUMENTS ────────────────────────────────────────────────

  async findAllSops(companyId: string, query: QuerySopDto) {
    const { departmentId, search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SopDocumentWhereInput = {
      companyId,
      ...(departmentId && { departmentId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.sopDocument.findMany({
        where,
        include: {
          department: { select: { id: true, name: true } },
          _count: { select: { acknowledgements: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.sopDocument.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createSop(companyId: string, dto: CreateSopDto) {
    if (dto.departmentId) {
      const dept = await this.prisma.department.findFirst({
        where: { id: dto.departmentId, companyId },
      });
      if (!dept) throw new NotFoundException('Department not found');
    }

    return this.prisma.sopDocument.create({
      data: {
        companyId,
        title: dto.title,
        content: dto.content,
        fileUrl: dto.fileUrl,
        departmentId: dto.departmentId,
      },
      include: {
        department: { select: { id: true, name: true } },
      },
    });
  }

  async findOneSop(companyId: string, id: string) {
    const sop = await this.prisma.sopDocument.findFirst({
      where: { id, companyId },
      include: {
        department: { select: { id: true, name: true } },
        acknowledgements: {
          include: {
            employee: {
              include: {
                users: {
                  select: { firstName: true, lastName: true, email: true },
                },
              },
            },
          },
          orderBy: { acknowledgedAt: 'desc' },
        },
        _count: { select: { acknowledgements: true } },
      },
    });

    if (!sop) throw new NotFoundException('SOP document not found');
    return sop;
  }

  async updateSop(companyId: string, id: string, dto: UpdateSopDto) {
    const sop = await this.prisma.sopDocument.findFirst({
      where: { id, companyId },
    });
    if (!sop) throw new NotFoundException('SOP document not found');

    return this.prisma.sopDocument.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.fileUrl !== undefined && { fileUrl: dto.fileUrl }),
        ...(dto.departmentId !== undefined && { departmentId: dto.departmentId }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: {
        department: { select: { id: true, name: true } },
      },
    });
  }

  async removeSop(companyId: string, id: string) {
    const sop = await this.prisma.sopDocument.findFirst({
      where: { id, companyId },
    });
    if (!sop) throw new NotFoundException('SOP document not found');

    return this.prisma.sopDocument.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ─── SOP ACKNOWLEDGEMENTS ─────────────────────────────────────────

  async acknowledgeSop(companyId: string, sopId: string, employeeId: string) {
    const sop = await this.prisma.sopDocument.findFirst({
      where: { id: sopId, companyId },
    });
    if (!sop) throw new NotFoundException('SOP document not found');
    if (!sop.isActive) throw new BadRequestException('SOP document is not active');

    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, companyId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    const existing = await this.prisma.sopAcknowledgement.findFirst({
      where: { sopDocumentId: sopId, employeeId },
    });
    if (existing) {
      throw new ConflictException('Employee has already acknowledged this SOP');
    }

    return this.prisma.sopAcknowledgement.create({
      data: { sopDocumentId: sopId, employeeId, companyId },
      include: {
        employee: {
          include: {
            users: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });
  }

  async listAcknowledgements(companyId: string, sopId: string) {
    const sop = await this.prisma.sopDocument.findFirst({
      where: { id: sopId, companyId },
    });
    if (!sop) throw new NotFoundException('SOP document not found');

    return this.prisma.sopAcknowledgement.findMany({
      where: { sopDocumentId: sopId },
      include: {
        employee: {
          include: {
            users: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
      orderBy: { acknowledgedAt: 'desc' },
    });
  }

  // ─── TRAINING RECORDS ─────────────────────────────────────────────

  async findAllRecords(companyId: string, query: QueryTrainingRecordDto) {
    const { employeeId, sopDocumentId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TrainingRecordWhereInput = {
      companyId,
      ...(employeeId && { employeeId }),
      ...(sopDocumentId && { sopDocumentId }),
    };

    const [items, total] = await Promise.all([
      this.prisma.trainingRecord.findMany({
        where,
        include: {
          sopDocument: {
            select: { id: true, title: true, version: true },
          },
          employee: {
            include: {
              users: {
                select: { firstName: true, lastName: true, email: true },
              },
            },
          },
        },
        orderBy: { completedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.trainingRecord.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createRecord(companyId: string, dto: CreateTrainingRecordDto) {
    const sop = await this.prisma.sopDocument.findFirst({
      where: { id: dto.sopDocumentId, companyId },
    });
    if (!sop) throw new NotFoundException('SOP document not found');

    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, companyId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    return this.prisma.trainingRecord.create({
      data: {
        employeeId: dto.employeeId,
        sopDocumentId: dto.sopDocumentId,
        completedAt: dto.completedAt ? new Date(dto.completedAt) : new Date(),
        score: dto.score,
        companyId,
      },
      include: {
        sopDocument: {
          select: { id: true, title: true, version: true },
        },
        employee: {
          include: {
            users: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });
  }
}
