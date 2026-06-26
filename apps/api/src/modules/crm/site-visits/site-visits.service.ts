import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../config/prisma.service';
import { TransitionService } from '../../../common/services/transition.service';
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
    private transitionService: TransitionService,
  ) {}

  async create(dto: CreateSiteVisitDto, companyId: string, currentUserRole?: string, currentEmployeeId?: string) {
    if (dto.assignedToEmployeeId) {
      const assigned = await this.prisma.employee.findFirst({
        where: { id: dto.assignedToEmployeeId, companyId },
      });
      if (!assigned) {
        throw new BadRequestException('Assigned employee not found in your company');
      }
    }

    const property = await this.prisma.property.findFirst({
      where: { id: dto.propertyId, companyId },
    });
    if (!property) {
      throw new BadRequestException('Property not found in your company');
    }

    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, companyId },
    });
    if (!customer) {
      throw new BadRequestException('Customer not found in your company');
    }

    if (dto.leadId) {
      const lead = await this.prisma.lead.findFirst({
        where: { id: dto.leadId, companyId },
      });
      if (!lead) {
        throw new BadRequestException('Lead not found in your company');
      }
    }

    if (currentUserRole === 'EMPLOYEE' && dto.assignedToEmployeeId !== currentEmployeeId) {
      throw new BadRequestException('Employees can only create site visits assigned to themselves');
    }

    const siteVisit = await this.prisma.$transaction(async (tx) => {
      return tx.siteVisit.create({
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
    });
    this.eventEmitter.emit('siteVisit.created', {
      companyId,
      entityId: siteVisit.id,
    });
    return siteVisit;
  }

  async findAll(
    query: QuerySiteVisitDto,
    companyId: string,
    myEmployeeId?: string,
  ) {
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
    if (myEmployeeId) {
      where.assignedToEmployeeId = myEmployeeId;
    } else if (assignedToEmployeeId) {
      where.assignedToEmployeeId = assignedToEmployeeId;
    }
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

  async findOne(id: string, companyId: string, employeeId?: string) {
    const siteVisit = await this.prisma.siteVisit.findFirst({
      where: { id, companyId, ...(employeeId && { assignedToEmployeeId: employeeId }) },
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

  async update(id: string, dto: UpdateSiteVisitDto, companyId: string, employeeId?: string, currentUserRole?: string, currentEmployeeId?: string) {
    const existing = await this.findOne(id, companyId, employeeId);

    if (dto.assignedToEmployeeId !== undefined && dto.assignedToEmployeeId !== existing.assignedToEmployeeId) {
      if (dto.assignedToEmployeeId) {
        const assigned = await this.prisma.employee.findFirst({
          where: { id: dto.assignedToEmployeeId, companyId },
        });
        if (!assigned) {
          throw new BadRequestException('Assigned employee not found in your company');
        }
      }
      if (currentUserRole === 'EMPLOYEE') {
        throw new BadRequestException('Employees cannot reassign site visits');
      }
    }

    if (dto.propertyId !== undefined && dto.propertyId !== existing.propertyId) {
      const property = await this.prisma.property.findFirst({
        where: { id: dto.propertyId, companyId },
      });
      if (!property) {
        throw new BadRequestException('Property not found in your company');
      }
    }

    if (dto.customerId !== undefined && dto.customerId !== existing.customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: dto.customerId, companyId },
      });
      if (!customer) {
        throw new BadRequestException('Customer not found in your company');
      }
    }

    if (dto.leadId !== undefined && dto.leadId !== existing.leadId) {
      const lead = await this.prisma.lead.findFirst({
        where: { id: dto.leadId, companyId },
      });
      if (!lead) {
        throw new BadRequestException('Lead not found in your company');
      }
    }

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

  async updateStatus(id: string, status: SiteVisitStatus, companyId: string, employeeId?: string, currentUserRole?: string, currentEmployeeId?: string) {
    const updated = await this.transitionService.execute({
      entityType: 'SiteVisit',
      id,
      newStatus: status,
      companyId,
      currentUserRole,
      currentEmployeeId,
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
