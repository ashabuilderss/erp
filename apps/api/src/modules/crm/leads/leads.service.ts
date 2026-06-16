import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../config/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { QueryLeadDto } from './dto/query-lead.dto';
import { LeadStatus, Prisma } from '@prisma/client';
import { safeSortBy } from '../../../common/utils/sort-by';
import { NotificationEvents } from '../../notifications/events/notification-events';

const ALLOWED_SORT = [
  'createdAt',
  'updatedAt',
  'customerName',
  'customerEmail',
  'status',
  'source',
] as const;

@Injectable()
export class LeadsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async getMyLeads(employeeId: string, companyId: string) {
    return this.prisma.lead.findMany({
      where: { assignedToEmployeeId: employeeId, companyId },
      include: { property: true, assignedTo: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateLeadDto, companyId: string) {
    const { customerId, ...rest } = dto;
    const lead = await this.prisma.lead.create({
      data: {
        ...rest,
        convertedToCustomerId: customerId || null,
        companyId,
      },
      include: {
        property: true,
        assignedTo: {
          include: { user: true },
        },
        convertedToCustomer: true,
      },
    });
    this.eventEmitter.emit('lead.created', { companyId, entityId: lead.id });
    return lead;
  }

  async findAll(query: QueryLeadDto, companyId: string, myEmployeeId?: string) {
    const {
      page = 1,
      limit = 10,
      search,
      propertyId,
      source,
      status,
      assignedToEmployeeId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.LeadWhereInput = { companyId };

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (propertyId) where.propertyId = propertyId;
    if (source) where.source = source;
    if (status) where.status = status;
    if (myEmployeeId) {
      where.assignedToEmployeeId = myEmployeeId;
    } else if (assignedToEmployeeId) {
      where.assignedToEmployeeId = assignedToEmployeeId;
    }

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        orderBy: { [safeSortBy(sortBy, ALLOWED_SORT, 'createdAt')]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          property: true,
          assignedTo: {
            include: { user: true },
          },
          convertedToCustomer: true,
        },
      }),
      this.prisma.lead.count({ where }),
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
    const lead = await this.prisma.lead.findFirst({
      where: { id, companyId },
      include: {
        property: true,
        assignedTo: {
          include: { user: true },
        },
        convertedToCustomer: true,
        siteVisits: true,
        bookings: true,
      },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    return lead;
  }

  async update(id: string, dto: UpdateLeadDto, companyId: string) {
    const before = await this.findOne(id, companyId);

    const { customerId, ...rest } = dto;
    const updateData: any = { ...rest };
    if (customerId !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      updateData.convertedToCustomerId = customerId || null;
    }

    const updated = await this.prisma.lead.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: updateData,
      include: {
        property: true,
        assignedTo: {
          include: { user: true },
        },
        convertedToCustomer: true,
      },
    });

    if (
      dto.assignedToEmployeeId &&
      dto.assignedToEmployeeId !== before.assignedToEmployeeId
    ) {
      const assignedTo = updated.assignedTo;
      if (assignedTo?.user) {
        this.eventEmitter.emit(NotificationEvents.LeadAssigned, {
          userId: assignedTo.user.id,
          companyId,
          title: 'New Lead Assigned',
          message: `Lead "${updated.customerName}" has been assigned to you`,
          type: 'LEAD_ASSIGNED',
          link: `/leads/${id}`,
        });
      }
    }

    this.eventEmitter.emit('lead.updated', { companyId, entityId: id });
    return updated;
  }

  async updateStatus(id: string, status: LeadStatus, companyId: string) {
    const lead = await this.findOne(id, companyId);

    const validTransitions: Record<LeadStatus, LeadStatus[]> = {
      NEW: ['CONTACTED', 'LOST'],
      CONTACTED: ['INTERESTED', 'LOST', 'NEW'],
      INTERESTED: ['SITE_VISIT_SCHEDULED', 'NEGOTIATION', 'LOST', 'CONTACTED'],
      SITE_VISIT_SCHEDULED: ['NEGOTIATION', 'CONVERTED', 'LOST', 'INTERESTED'],
      NEGOTIATION: ['CONVERTED', 'LOST', 'SITE_VISIT_SCHEDULED'],
      CONVERTED: [],
      LOST: ['NEW', 'CONTACTED'],
    };

    const allowed = validTransitions[lead.status] || [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Invalid status transition from ${lead.status} to ${status}`,
      );
    }

    const updated = await this.prisma.lead.update({
      where: { id },
      data: { status },
      include: {
        property: true,
        assignedTo: {
          include: { user: true },
        },
        convertedToCustomer: true,
      },
    });
    this.eventEmitter.emit('lead.updated', { companyId, entityId: id });
    return updated;
  }

  async convertToCustomer(id: string, companyId: string) {
    const lead = await this.findOne(id, companyId);

    if (lead.status === 'CONVERTED' && lead.convertedToCustomerId) {
      throw new BadRequestException('Lead is already converted to a customer');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          name: lead.customerName,
          email: lead.customerEmail,
          phone: lead.customerPhone,
          type: 'BUYER',
          source: lead.source,
          notes: lead.notes,
          companyId,
          createdById: lead.assignedToEmployeeId,
        },
      });

      if (lead.propertyId) {
        await tx.property.update({
          where: { id: lead.propertyId },
          data: { status: 'BOOKED' },
        });
      }

      const updatedLead = await tx.lead.update({
        where: { id },
        data: {
          status: 'CONVERTED',
          convertedToCustomerId: customer.id,
        },
        include: {
          property: true,
          assignedTo: {
            include: { user: true },
          },
          convertedToCustomer: true,
        },
      });

      return { lead: updatedLead, customer };
    });

    this.eventEmitter.emit('lead.updated', { companyId, entityId: id });

    const assignedUser = result.lead.assignedTo?.user;
    if (assignedUser) {
      this.eventEmitter.emit(NotificationEvents.LeadConverted, {
        userId: assignedUser.id,
        companyId,
        title: 'Lead Converted',
        message: `Lead "${result.lead.customerName}" has been converted to a customer`,
        type: 'LEAD_CONVERTED',
        link: `/leads/${id}`,
      });
    }

    return result;
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    await this.prisma.lead.delete({ where: { id } });
    this.eventEmitter.emit('lead.deleted', { companyId, entityId: id });
  }
}
