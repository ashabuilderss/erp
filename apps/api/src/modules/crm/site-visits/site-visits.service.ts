import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../config/prisma.service';
import { CreateSiteVisitDto } from './dto/create-site-visit.dto';
import { UpdateSiteVisitDto } from './dto/update-site-visit.dto';
import { QuerySiteVisitDto } from './dto/query-site-visit.dto';
import { SiteVisitStatus, Prisma } from '@prisma/client';
import { safeSortBy } from '../../../common/utils/sort-by';

const ALLOWED_SORT = [
  'createdAt',
  'updatedAt',
  'scheduledDate',
  'status',
] as const;

@Injectable()
export class SiteVisitsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateSiteVisitDto, companyId: string) {
    const siteVisit = await this.prisma.siteVisit.create({
      data: {
        ...dto,
        companyId,
        scheduledDate: new Date(dto.scheduledDate),
      },
      include: {
        property: true,
        customer: true,
        lead: true,
        assignedTo: {
          include: { user: true },
        },
      },
    });
    this.eventEmitter.emit('siteVisit.created', {
      companyId,
      entityId: siteVisit.id,
    });
    return siteVisit;
  }

  async findAll(query: QuerySiteVisitDto, companyId: string) {
    const {
      page = 1,
      limit = 10,
      search,
      propertyId,
      customerId,
      leadId,
      status,
      scheduledDateFrom,
      scheduledDateTo,
      assignedToEmployeeId,
      sortBy = 'scheduledDate',
      sortOrder = 'asc',
    } = query;

    const where: Prisma.SiteVisitWhereInput = { companyId };

    if (search) {
      where.OR = [
        { property: { title: { contains: search, mode: 'insensitive' } } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (propertyId) where.propertyId = propertyId;
    if (customerId) where.customerId = customerId;
    if (leadId) where.leadId = leadId;
    if (status) where.status = status;
    if (assignedToEmployeeId) where.assignedToEmployeeId = assignedToEmployeeId;
    if (scheduledDateFrom || scheduledDateTo) {
      where.scheduledDate = {};
      if (scheduledDateFrom)
        where.scheduledDate.gte = new Date(scheduledDateFrom);
      if (scheduledDateTo) where.scheduledDate.lte = new Date(scheduledDateTo);
    }

    const [data, total] = await Promise.all([
      this.prisma.siteVisit.findMany({
        where,
        orderBy: {
          [safeSortBy(sortBy, ALLOWED_SORT, 'scheduledDate')]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          property: true,
          customer: true,
          lead: true,
          assignedTo: {
            include: { user: true },
          },
        },
      }),
      this.prisma.siteVisit.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, companyId: string) {
    const siteVisit = await this.prisma.siteVisit.findFirst({
      where: { id, companyId },
      include: {
        property: true,
        customer: true,
        lead: true,
        assignedTo: {
          include: { user: true },
        },
      },
    });

    if (!siteVisit) {
      throw new NotFoundException(`Site visit with ID ${id} not found`);
    }

    return siteVisit;
  }

  async update(id: string, dto: UpdateSiteVisitDto, companyId: string) {
    await this.findOne(id, companyId);

    const data: Prisma.SiteVisitUpdateInput = { ...dto };

    if (dto.scheduledDate) {
      data.scheduledDate = new Date(dto.scheduledDate);
    }

    const updated = await this.prisma.siteVisit.update({
      where: { id },
      data,
      include: {
        property: true,
        customer: true,
        lead: true,
        assignedTo: {
          include: { user: true },
        },
      },
    });
    this.eventEmitter.emit('siteVisit.updated', { companyId, entityId: id });
    return updated;
  }

  async updateStatus(id: string, status: SiteVisitStatus, companyId: string) {
    const siteVisit = await this.findOne(id, companyId);

    const validTransitions: Record<SiteVisitStatus, SiteVisitStatus[]> = {
      SCHEDULED: ['COMPLETED', 'CANCELLED', 'RESCHEDULED'],
      COMPLETED: ['SCHEDULED'],
      CANCELLED: ['SCHEDULED'],
      RESCHEDULED: ['COMPLETED', 'CANCELLED', 'SCHEDULED'],
    };

    const allowed = validTransitions[siteVisit.status] || [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Invalid status transition from ${siteVisit.status} to ${status}`,
      );
    }

    const updated = await this.prisma.siteVisit.update({
      where: { id },
      data: { status },
      include: {
        property: true,
        customer: true,
        lead: true,
        assignedTo: {
          include: { user: true },
        },
      },
    });
    this.eventEmitter.emit('siteVisit.updated', { companyId, entityId: id });
    return updated;
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    await this.prisma.siteVisit.delete({ where: { id } });
    this.eventEmitter.emit('siteVisit.deleted', { companyId, entityId: id });
  }
}
