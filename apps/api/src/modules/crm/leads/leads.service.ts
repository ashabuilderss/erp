import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../config/prisma.service';
import { TransitionService } from '../../../common/services/transition.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { QueryLeadDto } from './dto/query-lead.dto';
import { LeadStatus, Prisma } from '@prisma/client';
import { safeSortBy } from '../../../common/utils/sort-by';
import { NotificationEvents } from '../../notifications/events/notification-events';
import { GovernanceEventPublisher } from '../../governance-events/governance-event.publisher';
import { DomainEventTypes } from '../../governance-events/types/events';
import { isOwnDataScope } from '../../../common/utils/role-scope.util';

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
    private transitionService: TransitionService,
    private governanceEventPublisher: GovernanceEventPublisher,
  ) {}

  async getMyLeads(employeeId: string, companyId: string) {
    return this.prisma.lead.findMany({
      where: { assignedToEmployeeId: employeeId, companyId, deletedAt: null },
      include: { properties: true, employees: { include: { users: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    dto: CreateLeadDto,
    companyId: string,
    currentUserRole?: string,
    currentEmployeeId?: string,
  ) {
    const { customerId, ...rest } = dto;

    if (dto.assignedToEmployeeId) {
      const assigned = await this.prisma.employee.findFirst({
        where: { id: dto.assignedToEmployeeId, companyId },
      });
      if (!assigned) {
        throw new BadRequestException(
          'Assigned employee not found in your company',
        );
      }
    }

    if (dto.propertyId) {
      const property = await this.prisma.property.findFirst({
        where: { id: dto.propertyId, companyId },
      });
      if (!property) {
        throw new BadRequestException('Property not found in your company');
      }
    }

    if (customerId) {
      const cust = await this.prisma.customer.findFirst({
        where: { id: customerId, companyId },
      });
      if (!cust) {
        throw new BadRequestException('Customer not found in your company');
      }
    }

    if (
      isOwnDataScope(currentUserRole!) &&
      dto.assignedToEmployeeId != null &&
      dto.assignedToEmployeeId !== currentEmployeeId
    ) {
      throw new BadRequestException(
        'Employees can only create leads assigned to themselves',
      );
    }

    const lead = await this.prisma.lead.create({
      data: {
        ...rest,
        convertedToCustomerId: customerId || null,
        companyId,
      },
      include: {
        properties: true,
        employees: {
          include: { users: true },
        },
        customers: true,
      },
    });
    this.eventEmitter.emit('lead.created', { companyId, entityId: lead.id });
    return lead;
  }

  async findAll(query: QueryLeadDto, scopeFilter?: Record<string, any>) {
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

    const companyId = scopeFilter?.companyId ?? '';
    const where: Prisma.LeadWhereInput = {
      companyId,
      deletedAt: null,
      ...scopeFilter,
    };

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
    // Only apply explicit assignedToEmployeeId filter if scope hasn't already restricted it
    if (assignedToEmployeeId && where.assignedToEmployeeId === undefined) {
      where.assignedToEmployeeId = assignedToEmployeeId;
    }

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        orderBy: { [safeSortBy(sortBy, ALLOWED_SORT, 'createdAt')]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          properties: true,
          employees: {
            include: { users: true },
          },
          customers: true,
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

  async findOne(id: string, scopeFilter?: Record<string, any>) {
    const lead = await this.prisma.lead.findFirst({
      where: {
        id,
        deletedAt: null,
        ...scopeFilter,
      },
      include: {
        properties: true,
        employees: {
          include: { users: true },
        },
        customers: true,
        siteVisits: true,
        bookings: true,
      },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    return lead;
  }

  async update(
    id: string,
    dto: UpdateLeadDto,
    companyId: string,
    scopeFilter?: Record<string, any>,
    currentUserRole?: string,
    currentEmployeeId?: string,
  ) {
    const before = await this.findOne(id, scopeFilter);

    if (
      dto.assignedToEmployeeId !== undefined &&
      dto.assignedToEmployeeId !== before.assignedToEmployeeId
    ) {
      if (dto.assignedToEmployeeId) {
        const assigned = await this.prisma.employee.findFirst({
          where: { id: dto.assignedToEmployeeId, companyId },
        });
        if (!assigned) {
          throw new BadRequestException(
            'Assigned employee not found in your company',
          );
        }
      }
      if (isOwnDataScope(currentUserRole!)) {
        throw new BadRequestException('Employees cannot reassign leads');
      }
    }

    if (dto.propertyId !== undefined && dto.propertyId !== before.propertyId) {
      const property = await this.prisma.property.findFirst({
        where: { id: dto.propertyId, companyId },
      });
      if (!property) {
        throw new BadRequestException('Property not found in your company');
      }
    }

    if (dto.customerId !== undefined) {
      if (dto.customerId) {
        const cust = await this.prisma.customer.findFirst({
          where: { id: dto.customerId, companyId },
        });
        if (!cust) {
          throw new BadRequestException('Customer not found in your company');
        }
      }
    }

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
        properties: true,
        employees: {
          include: { users: true },
        },
        customers: true,
      },
    });

    if (
      dto.assignedToEmployeeId &&
      dto.assignedToEmployeeId !== before.assignedToEmployeeId
    ) {
      const assignedTo = updated.employees;
      if (assignedTo?.users) {
        this.eventEmitter.emit(NotificationEvents.LeadAssigned, {
          userId: assignedTo.users.id,
          companyId,
          title: 'New Lead Assigned',
          message: `Lead "${updated.customerName}" has been assigned to you`,
          type: 'LEAD_ASSIGNED',
          link: `/dashboard/leads/${id}`,
        });
      }
    }

    this.eventEmitter.emit('lead.updated', { companyId, entityId: id });
    return updated;
  }

  async updateStatus(
    id: string,
    status: LeadStatus,
    companyId: string,
    scopeFilter?: Record<string, any>,
    currentUserRole?: string,
    currentEmployeeId?: string,
    lostReason?: string,
  ) {
    if (status === LeadStatus.LOST && !lostReason) {
      throw new BadRequestException(
        'lostReason is required when status is LOST',
      );
    }

    await this.findOne(id, scopeFilter);

    const updated = await this.transitionService.execute({
      entityType: 'Lead',
      id,
      newStatus: status,
      companyId,
      currentUserRole,
      currentEmployeeId,
      before: lostReason
        ? async (tx: any, _entity: any) => {
            await tx.lead.update({
              where: { id },
              data: { lostReason },
            });
          }
        : undefined,
      include: {
        properties: true,
        employees: {
          include: { users: true },
        },
        customers: true,
      },
    });
    this.eventEmitter.emit('lead.updated', { companyId, entityId: id });
    return updated;
  }

  async convertToCustomer(id: string, scopeFilter?: Record<string, any>) {
    const lead = await this.findOne(id, scopeFilter);
    const companyId = scopeFilter?.companyId ?? '';

    if (lead.status === 'CONVERTED' && lead.convertedToCustomerId) {
      throw new BadRequestException('Lead is already converted to a customer');
    }

    // Validate Lead FSM transition before converting
    this.transitionService.validate('Lead', lead.status, 'CONVERTED');

    // Validate Property FSM transition if lead has an associated property
    if (lead.propertyId && lead.properties?.status) {
      this.transitionService.validate(
        'Property',
        lead.properties.status,
        'BOOKED',
      );
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

      const updatedLead = await tx.lead.update({
        where: { id },
        data: {
          status: 'CONVERTED',
          convertedToCustomerId: customer.id,
        },
        include: {
          properties: true,
          employees: {
            include: { users: true },
          },
          customers: true,
        },
      });

      // Mark associated property as BOOKED when lead converts
      if (lead.propertyId) {
        await tx.property.update({
          where: { id: lead.propertyId },
          data: { status: 'BOOKED' },
        });
      }

      await this.governanceEventPublisher.publish(tx, {
        eventType: DomainEventTypes.LEAD_STATUS_CHANGED,
        entityType: 'Lead',
        entityId: id,
        companyId,
        payload: {
          companyId,
          userId: lead.assignedToEmployeeId || 'system',
          eventType: DomainEventTypes.LEAD_STATUS_CHANGED,
          metadata: {
            previousStatus: lead.status,
            newStatus: 'CONVERTED',
            leadName: lead.customerName,
            convertedToCustomerId: customer.id,
            convertedToCustomerName: customer.name,
          },
        },
      });

      return { lead: updatedLead, customer };
    });

    this.eventEmitter.emit('lead.updated', { companyId, entityId: id });

    const assignedUser = result.lead.employees?.users;
    if (assignedUser) {
      this.eventEmitter.emit(NotificationEvents.LeadConverted, {
        userId: assignedUser.id,
        companyId,
        title: 'Lead Converted',
        message: `Lead "${result.lead.customerName}" has been converted to a customer`,
        type: 'LEAD_CONVERTED',
        link: `/dashboard/leads/${id}`,
      });
    }

    return result;
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, { companyId });
    await this.prisma.lead.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    this.eventEmitter.emit('lead.deleted', { companyId, entityId: id });
    return { success: true };
  }
}
