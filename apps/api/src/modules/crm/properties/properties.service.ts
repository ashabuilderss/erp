import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../config/prisma.service';
import { TransitionService } from '../../../common/services/transition.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { QueryPropertyDto } from './dto/query-property.dto';
import { PropertyStatus, Prisma } from '@prisma/client';
import { safeSortBy } from '../../../common/utils/sort-by';
import { GovernanceEventPublisher } from '../../governance-events/governance-event.publisher';
import { DomainEventTypes } from '../../governance-events/types/events';
import { isOwnDataScope } from '../../../common/utils/role-scope.util';

const ALLOWED_SORT = [
  'createdAt',
  'updatedAt',
  'title',
  'price',
  'status',
  'type',
  'city',
  'state',
  'propertyCode',
  'locality',
] as const;

@Injectable()
export class PropertiesService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private transitionService: TransitionService,
    private governanceEventPublisher: GovernanceEventPublisher,
  ) {}

  async getMyProperties(employeeId: string, companyId: string) {
    return this.prisma.property.findMany({
      where: { assignedToEmployeeId: employeeId, companyId },
      include: { employees: { include: { users: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    dto: CreatePropertyDto,
    companyId: string,
    currentUserRole?: string,
    currentEmployeeId?: string,
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

    // Employees can only create properties assigned to themselves
    if (
      isOwnDataScope(currentUserRole!) &&
      dto.assignedToEmployeeId !== currentEmployeeId
    ) {
      throw new BadRequestException(
        'Employees can only create properties assigned to themselves',
      );
    }

    const property = await this.prisma.$transaction(async (tx) => {
      const p = await tx.property.create({
        data: {
          ...dto,
          companyId,
          images: dto.images ?? [],
          amenities: dto.amenities ?? [],
          price: new Prisma.Decimal(dto.price),
          area: dto.area ? new Prisma.Decimal(dto.area) : null,
        },
        include: {
          employees: {
            include: { users: true },
          },
        },
      });

      await this.governanceEventPublisher.publish(tx, {
        eventType: DomainEventTypes.PROPERTY_CREATED,
        entityType: 'Property',
        entityId: p.id,
        companyId,
        payload: {
          companyId,
          userId: currentEmployeeId || 'system',
          eventType: DomainEventTypes.PROPERTY_CREATED,
          metadata: {
            title: p.title,
            price: p.price,
            type: p.type,
            city: p.city,
          },
        },
      });

      return p;
    });
    this.eventEmitter.emit('property.created', {
      companyId,
      entityId: property.id,
    });
    return property;
  }

  async findAll(
    query: QueryPropertyDto,
    companyId: string,
    myEmployeeId?: string,
  ) {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      status,
      city,
      locality,
      assignedToEmployeeId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.PropertyWhereInput = { companyId, deletedAt: null };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { propertyCode: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { locality: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) where.type = type;
    if (status) where.status = status;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (locality) where.locality = { contains: locality, mode: 'insensitive' };
    if (myEmployeeId) {
      where.assignedToEmployeeId = myEmployeeId;
    } else if (assignedToEmployeeId) {
      where.assignedToEmployeeId = assignedToEmployeeId;
    }

    const [data, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        orderBy: { [safeSortBy(sortBy, ALLOWED_SORT, 'createdAt')]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          employees: {
            include: { users: true },
          },
        },
      }),
      this.prisma.property.count({ where }),
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
    const property = await this.prisma.property.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
        ...(employeeId && { assignedToEmployeeId: employeeId }),
      },
      include: {
        employees: {
          include: { users: true },
        },
        leads: true,
        siteVisits: true,
        bookings: true,
      },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    return property;
  }

  async update(
    id: string,
    dto: UpdatePropertyDto,
    companyId: string,
    employeeId?: string,
    currentUserRole?: string,
    currentEmployeeId?: string,
  ) {
    const existing = await this.findOne(id, companyId, employeeId);

    // Validate assignedToEmployeeId change
    if (
      dto.assignedToEmployeeId !== undefined &&
      dto.assignedToEmployeeId !== existing.assignedToEmployeeId
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
      // Employees cannot reassign properties to other employees
      if (isOwnDataScope(currentUserRole!)) {
        throw new BadRequestException('Employees cannot reassign properties');
      }
    }

    const data: Prisma.PropertyUpdateInput = { ...dto };

    if (dto.price !== undefined) {
      data.price = new Prisma.Decimal(dto.price);
    }
    if (dto.area !== undefined) {
      data.area = dto.area ? new Prisma.Decimal(dto.area) : null;
    }

    const updated = await this.prisma.property.update({
      where: { id },
      data,
      include: {
        employees: {
          include: { users: true },
        },
      },
    });
    this.eventEmitter.emit('property.updated', { companyId, entityId: id });
    return updated;
  }

  async updateStatus(
    id: string,
    status: PropertyStatus,
    companyId: string,
    employeeId?: string,
    currentUserRole?: string,
    currentEmployeeId?: string,
  ) {
    const existing = await this.findOne(id, companyId, employeeId);
    const updated = await this.transitionService.execute({
      entityType: 'Property',
      id,
      newStatus: status,
      companyId,
      currentUserRole,
      currentEmployeeId,
      before: async (tx) => {
        if (existing.status !== status) {
          await this.governanceEventPublisher.publish(tx, {
            eventType: DomainEventTypes.PROPERTY_STATUS_CHANGED,
            entityType: 'Property',
            entityId: id,
            companyId,
            payload: {
              companyId,
              userId: currentEmployeeId || 'system',
              eventType: DomainEventTypes.PROPERTY_STATUS_CHANGED,
              metadata: {
                previousStatus: existing.status,
                newStatus: status,
                title: existing.title,
              },
            },
          });
        }
      },
      include: {
        employees: {
          include: { users: true },
        },
      },
    });
    this.eventEmitter.emit('property.updated', { companyId, entityId: id });
    return updated;
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    const result = await this.prisma.property.update({ where: { id }, data: { deletedAt: new Date() } });
    this.eventEmitter.emit('property.deleted', { companyId, entityId: id });
    return result;
  }
}
