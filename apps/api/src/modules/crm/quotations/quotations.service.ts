import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import { TransitionService } from '../../../common/services/transition.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { QueryQuotationDto } from './dto/query-quotation.dto';
import { UpdateQuotationStatusDto } from './dto/update-quotation-status.dto';
import { QuotationAction } from '@prisma/client';
import { QuotationPdfService } from './quotation-pdf.service';

@Injectable()
export class QuotationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: QuotationPdfService,
    private readonly transitionService: TransitionService,
  ) {}

  async create(companyId: string, employeeId: string, dto: CreateQuotationDto) {
    const existing = await this.prisma.quotation.findFirst({
      where: { companyId, referenceNumber: dto.referenceNumber },
    });
    if (existing) {
      throw new BadRequestException(
        'Quotation reference number must be unique',
      );
    }

    return await this.prisma.quotation.create({
      data: {
        companyId,
        referenceNumber: dto.referenceNumber,
        leadId: dto.leadId,
        propertyId: dto.propertyId,
        customerId: dto.customerId,
        totalAmount: dto.totalAmount,
        breakdown: dto.breakdown,
        validUntil: new Date(dto.validUntil),
        notes: dto.notes,
        createdById: employeeId,
      },
    });
  }

  async findAll(companyId: string, query: QueryQuotationDto) {
    const { page = 1, limit = 10, status, leadId, propertyId } = query;
    const skip = (page - 1) * limit;

    const where = {
      companyId,
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(leadId ? { leadId } : {}),
      ...(propertyId ? { propertyId } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.quotation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: true,
          lead: true,
          customer: true,
        },
      }),
      this.prisma.quotation.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(
    companyId: string,
    id: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const quotation = await this.prisma.quotation.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        createdBy: true,
        companies: true,
      },
    });

    if (!quotation) {
      throw new NotFoundException('Quotation not found');
    }

    // Log VIEW access
    await this.logAccess(
      companyId,
      id,
      userId,
      QuotationAction.VIEW,
      ipAddress,
      userAgent,
    );

    return quotation;
  }

  async updateStatus(
    companyId: string,
    id: string,
    dto: UpdateQuotationStatusDto,
  ) {
    const quotation = await this.prisma.quotation.findFirst({
      where: { id, companyId, deletedAt: null },
    });

    if (!quotation) {
      throw new NotFoundException('Quotation not found');
    }

    this.transitionService.validate('Quotation', quotation.status, dto.status);

    return await this.prisma.quotation.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async downloadPdf(
    companyId: string,
    id: string,
    userId: string,
    email: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const quotation = await this.prisma.quotation.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        createdBy: true,
        companies: true,
      },
    });

    if (!quotation) {
      throw new NotFoundException('Quotation not found');
    }

    // Log DOWNLOAD access
    await this.logAccess(
      companyId,
      id,
      userId,
      QuotationAction.DOWNLOAD,
      ipAddress,
      userAgent,
    );

    return await this.pdfService.generateWatermarkedPdf(quotation, email);
  }

  async getAccessLogs(companyId: string, quotationId: string) {
    return await this.prisma.quotationAccessLog.findMany({
      where: { companyId, quotationId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
  }

  private async logAccess(
    companyId: string,
    quotationId: string,
    userId: string,
    action: QuotationAction,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.prisma.quotationAccessLog.create({
      data: {
        companyId,
        quotationId,
        userId,
        action,
        ipAddress,
        userAgent,
      },
    });
  }
}
