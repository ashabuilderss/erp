"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertiesService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../../../config/prisma.service");
const transition_service_1 = require("../../../common/services/transition.service");
const client_1 = require("@prisma/client");
const sort_by_1 = require("../../../common/utils/sort-by");
const governance_event_publisher_1 = require("../../governance-events/governance-event.publisher");
const events_1 = require("../../governance-events/types/events");
const role_scope_util_1 = require("../../../common/utils/role-scope.util");
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
];
let PropertiesService = class PropertiesService {
    prisma;
    eventEmitter;
    transitionService;
    governanceEventPublisher;
    constructor(prisma, eventEmitter, transitionService, governanceEventPublisher) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
        this.transitionService = transitionService;
        this.governanceEventPublisher = governanceEventPublisher;
    }
    async getMyProperties(employeeId, companyId) {
        return this.prisma.property.findMany({
            where: { assignedToEmployeeId: employeeId, companyId },
            include: { employees: { include: { users: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(dto, companyId, currentUserRole, currentEmployeeId) {
        if (dto.assignedToEmployeeId) {
            const assigned = await this.prisma.employee.findFirst({
                where: { id: dto.assignedToEmployeeId, companyId },
            });
            if (!assigned) {
                throw new common_1.BadRequestException('Assigned employee not found in your company');
            }
        }
        if ((0, role_scope_util_1.isOwnDataScope)(currentUserRole) &&
            dto.assignedToEmployeeId !== currentEmployeeId) {
            throw new common_1.BadRequestException('Employees can only create properties assigned to themselves');
        }
        const property = await this.prisma.$transaction(async (tx) => {
            const p = await tx.property.create({
                data: {
                    ...dto,
                    companyId,
                    images: dto.images ?? [],
                    amenities: dto.amenities ?? [],
                    price: new client_1.Prisma.Decimal(dto.price),
                    area: dto.area ? new client_1.Prisma.Decimal(dto.area) : null,
                },
                include: {
                    employees: {
                        include: { users: true },
                    },
                },
            });
            await this.governanceEventPublisher.publish(tx, {
                eventType: events_1.DomainEventTypes.PROPERTY_CREATED,
                entityType: 'Property',
                entityId: p.id,
                companyId,
                payload: {
                    companyId,
                    userId: currentEmployeeId || 'system',
                    eventType: events_1.DomainEventTypes.PROPERTY_CREATED,
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
    async findAll(query, companyId, myEmployeeId) {
        const { page = 1, limit = 10, search, type, status, city, locality, assignedToEmployeeId, sortBy = 'createdAt', sortOrder = 'desc', } = query;
        const where = { companyId, deletedAt: null };
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
        if (type)
            where.type = type;
        if (status)
            where.status = status;
        if (city)
            where.city = { contains: city, mode: 'insensitive' };
        if (locality)
            where.locality = { contains: locality, mode: 'insensitive' };
        if (myEmployeeId) {
            where.assignedToEmployeeId = myEmployeeId;
        }
        else if (assignedToEmployeeId) {
            where.assignedToEmployeeId = assignedToEmployeeId;
        }
        const [data, total] = await Promise.all([
            this.prisma.property.findMany({
                where,
                orderBy: { [(0, sort_by_1.safeSortBy)(sortBy, ALLOWED_SORT, 'createdAt')]: sortOrder },
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
    async findOne(id, companyId, employeeId) {
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
            throw new common_1.NotFoundException(`Property with ID ${id} not found`);
        }
        return property;
    }
    async update(id, dto, companyId, employeeId, currentUserRole, currentEmployeeId) {
        const existing = await this.findOne(id, companyId, employeeId);
        if (dto.assignedToEmployeeId !== undefined &&
            dto.assignedToEmployeeId !== existing.assignedToEmployeeId) {
            if (dto.assignedToEmployeeId) {
                const assigned = await this.prisma.employee.findFirst({
                    where: { id: dto.assignedToEmployeeId, companyId },
                });
                if (!assigned) {
                    throw new common_1.BadRequestException('Assigned employee not found in your company');
                }
            }
            if ((0, role_scope_util_1.isOwnDataScope)(currentUserRole)) {
                throw new common_1.BadRequestException('Employees cannot reassign properties');
            }
        }
        const data = { ...dto };
        if (dto.price !== undefined) {
            data.price = new client_1.Prisma.Decimal(dto.price);
        }
        if (dto.area !== undefined) {
            data.area = dto.area ? new client_1.Prisma.Decimal(dto.area) : null;
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
    async updateStatus(id, status, companyId, employeeId, currentUserRole, currentEmployeeId) {
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
                        eventType: events_1.DomainEventTypes.PROPERTY_STATUS_CHANGED,
                        entityType: 'Property',
                        entityId: id,
                        companyId,
                        payload: {
                            companyId,
                            userId: currentEmployeeId || 'system',
                            eventType: events_1.DomainEventTypes.PROPERTY_STATUS_CHANGED,
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
    async remove(id, companyId) {
        await this.findOne(id, companyId);
        const result = await this.prisma.property.update({ where: { id }, data: { deletedAt: new Date() } });
        this.eventEmitter.emit('property.deleted', { companyId, entityId: id });
        return result;
    }
};
exports.PropertiesService = PropertiesService;
exports.PropertiesService = PropertiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2,
        transition_service_1.TransitionService,
        governance_event_publisher_1.GovernanceEventPublisher])
], PropertiesService);
//# sourceMappingURL=properties.service.js.map