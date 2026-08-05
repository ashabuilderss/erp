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
exports.SiteVisitsService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../../../config/prisma.service");
const transition_service_1 = require("../../../common/services/transition.service");
const sort_by_1 = require("../../../common/utils/sort-by");
const governance_event_publisher_1 = require("../../governance-events/governance-event.publisher");
const events_1 = require("../../governance-events/types/events");
const role_scope_util_1 = require("../../../common/utils/role-scope.util");
const ALLOWED_SORT = [
    'createdAt',
    'updatedAt',
    'scheduledDate',
    'status',
];
let SiteVisitsService = class SiteVisitsService {
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
    async create(dto, companyId, currentUserRole, currentEmployeeId) {
        if (dto.assignedToEmployeeId) {
            const assigned = await this.prisma.employee.findFirst({
                where: { id: dto.assignedToEmployeeId, companyId },
            });
            if (!assigned) {
                throw new common_1.BadRequestException('Assigned employee not found in your company');
            }
        }
        const property = await this.prisma.property.findFirst({
            where: { id: dto.propertyId, companyId },
        });
        if (!property) {
            throw new common_1.BadRequestException('Property not found in your company');
        }
        const customer = await this.prisma.customer.findFirst({
            where: { id: dto.customerId, companyId },
        });
        if (!customer) {
            throw new common_1.BadRequestException('Customer not found in your company');
        }
        if (dto.leadId) {
            const lead = await this.prisma.lead.findFirst({
                where: { id: dto.leadId, companyId },
            });
            if (!lead) {
                throw new common_1.BadRequestException('Lead not found in your company');
            }
        }
        if ((0, role_scope_util_1.isOwnDataScope)(currentUserRole) &&
            dto.assignedToEmployeeId !== currentEmployeeId) {
            throw new common_1.BadRequestException('Employees can only create site visits assigned to themselves');
        }
        const siteVisit = await this.prisma.$transaction(async (tx) => {
            const sv = await tx.siteVisit.create({
                data: {
                    ...dto,
                    companyId,
                    scheduledDate: new Date(dto.scheduledDate),
                },
                include: {
                    properties: true,
                    customers: true,
                    leads: true,
                    employees: {
                        include: { users: true },
                    },
                },
            });
            await this.governanceEventPublisher.publish(tx, {
                eventType: events_1.DomainEventTypes.SITE_VISIT_SCHEDULED,
                entityType: 'SiteVisit',
                entityId: sv.id,
                companyId,
                payload: {
                    companyId,
                    userId: currentEmployeeId || 'system',
                    eventType: events_1.DomainEventTypes.SITE_VISIT_SCHEDULED,
                    metadata: {
                        siteVisitDate: sv.scheduledDate,
                        propertyTitle: sv.properties?.title,
                        customerName: sv.customers?.name,
                    },
                },
            });
            return sv;
        });
        this.eventEmitter.emit('siteVisit.created', {
            companyId,
            entityId: siteVisit.id,
        });
        return siteVisit;
    }
    async findAll(query, companyId, myEmployeeId) {
        const { page = 1, limit = 10, search, propertyId, customerId, leadId, status, scheduledDateFrom, scheduledDateTo, assignedToEmployeeId, sortBy = 'scheduledDate', sortOrder = 'asc', } = query;
        const where = { companyId };
        if (search) {
            where.OR = [
                { properties: { title: { contains: search, mode: 'insensitive' } } },
                { customers: { name: { contains: search, mode: 'insensitive' } } },
            ];
        }
        if (propertyId)
            where.propertyId = propertyId;
        if (customerId)
            where.customerId = customerId;
        if (leadId)
            where.leadId = leadId;
        if (status)
            where.status = status;
        if (myEmployeeId) {
            where.assignedToEmployeeId = myEmployeeId;
        }
        else if (assignedToEmployeeId) {
            where.assignedToEmployeeId = assignedToEmployeeId;
        }
        if (scheduledDateFrom || scheduledDateTo) {
            where.scheduledDate = {};
            if (scheduledDateFrom)
                where.scheduledDate.gte = new Date(scheduledDateFrom);
            if (scheduledDateTo)
                where.scheduledDate.lte = new Date(scheduledDateTo);
        }
        const [data, total] = await Promise.all([
            this.prisma.siteVisit.findMany({
                where,
                orderBy: {
                    [(0, sort_by_1.safeSortBy)(sortBy, ALLOWED_SORT, 'scheduledDate')]: sortOrder,
                },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    properties: true,
                    customers: true,
                    leads: true,
                    employees: {
                        include: { users: true },
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
    async findOne(id, companyId, employeeId) {
        const siteVisit = await this.prisma.siteVisit.findFirst({
            where: {
                id,
                companyId,
                ...(employeeId && { assignedToEmployeeId: employeeId }),
            },
            include: {
                properties: true,
                customers: true,
                leads: true,
                employees: {
                    include: { users: true },
                },
            },
        });
        if (!siteVisit) {
            throw new common_1.NotFoundException(`Site visit with ID ${id} not found`);
        }
        return siteVisit;
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
                throw new common_1.BadRequestException('Employees cannot reassign site visits');
            }
        }
        if (dto.propertyId !== undefined &&
            dto.propertyId !== existing.propertyId) {
            const property = await this.prisma.property.findFirst({
                where: { id: dto.propertyId, companyId },
            });
            if (!property) {
                throw new common_1.BadRequestException('Property not found in your company');
            }
        }
        if (dto.customerId !== undefined &&
            dto.customerId !== existing.customerId) {
            const customer = await this.prisma.customer.findFirst({
                where: { id: dto.customerId, companyId },
            });
            if (!customer) {
                throw new common_1.BadRequestException('Customer not found in your company');
            }
        }
        if (dto.leadId !== undefined && dto.leadId !== existing.leadId) {
            const lead = await this.prisma.lead.findFirst({
                where: { id: dto.leadId, companyId },
            });
            if (!lead) {
                throw new common_1.BadRequestException('Lead not found in your company');
            }
        }
        const data = { ...dto };
        if (dto.scheduledDate) {
            data.scheduledDate = new Date(dto.scheduledDate);
        }
        const updated = await this.prisma.siteVisit.update({
            where: { id },
            data,
            include: {
                properties: true,
                customers: true,
                leads: true,
                employees: {
                    include: { users: true },
                },
            },
        });
        this.eventEmitter.emit('siteVisit.updated', { companyId, entityId: id });
        return updated;
    }
    async updateStatus(id, status, companyId, employeeId, currentUserRole, currentEmployeeId) {
        const updated = await this.transitionService.execute({
            entityType: 'SiteVisit',
            id,
            newStatus: status,
            companyId,
            currentUserRole,
            currentEmployeeId,
            before: async (tx) => {
                if (status === 'COMPLETED') {
                    await this.governanceEventPublisher.publish(tx, {
                        eventType: events_1.DomainEventTypes.SITE_VISIT_COMPLETED,
                        entityType: 'SiteVisit',
                        entityId: id,
                        companyId,
                        payload: {
                            companyId,
                            userId: currentEmployeeId || 'system',
                            eventType: events_1.DomainEventTypes.SITE_VISIT_COMPLETED,
                            metadata: {},
                        },
                    });
                }
            },
            include: {
                properties: true,
                customers: true,
                leads: true,
                employees: {
                    include: { users: true },
                },
            },
        });
        this.eventEmitter.emit('siteVisit.updated', { companyId, entityId: id });
        return updated;
    }
    async remove(id, companyId) {
        await this.findOne(id, companyId);
        await this.prisma.siteVisit.update({ where: { id }, data: { deletedAt: new Date() } });
        this.eventEmitter.emit('siteVisit.deleted', { companyId, entityId: id });
    }
};
exports.SiteVisitsService = SiteVisitsService;
exports.SiteVisitsService = SiteVisitsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2,
        transition_service_1.TransitionService,
        governance_event_publisher_1.GovernanceEventPublisher])
], SiteVisitsService);
//# sourceMappingURL=site-visits.service.js.map