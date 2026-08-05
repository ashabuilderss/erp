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
exports.LeadsService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../../../config/prisma.service");
const transition_service_1 = require("../../../common/services/transition.service");
const client_1 = require("@prisma/client");
const sort_by_1 = require("../../../common/utils/sort-by");
const notification_events_1 = require("../../notifications/events/notification-events");
const governance_event_publisher_1 = require("../../governance-events/governance-event.publisher");
const events_1 = require("../../governance-events/types/events");
const role_scope_util_1 = require("../../../common/utils/role-scope.util");
const ALLOWED_SORT = [
    'createdAt',
    'updatedAt',
    'customerName',
    'customerEmail',
    'status',
    'source',
];
let LeadsService = class LeadsService {
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
    async getMyLeads(employeeId, companyId) {
        return this.prisma.lead.findMany({
            where: { assignedToEmployeeId: employeeId, companyId, deletedAt: null },
            include: { properties: true, employees: { include: { users: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(dto, companyId, currentUserRole, currentEmployeeId) {
        const { customerId, ...rest } = dto;
        if (dto.assignedToEmployeeId) {
            const assigned = await this.prisma.employee.findFirst({
                where: { id: dto.assignedToEmployeeId, companyId },
            });
            if (!assigned) {
                throw new common_1.BadRequestException('Assigned employee not found in your company');
            }
        }
        if (dto.propertyId) {
            const property = await this.prisma.property.findFirst({
                where: { id: dto.propertyId, companyId },
            });
            if (!property) {
                throw new common_1.BadRequestException('Property not found in your company');
            }
        }
        if (customerId) {
            const cust = await this.prisma.customer.findFirst({
                where: { id: customerId, companyId },
            });
            if (!cust) {
                throw new common_1.BadRequestException('Customer not found in your company');
            }
        }
        if ((0, role_scope_util_1.isOwnDataScope)(currentUserRole) &&
            dto.assignedToEmployeeId != null &&
            dto.assignedToEmployeeId !== currentEmployeeId) {
            throw new common_1.BadRequestException('Employees can only create leads assigned to themselves');
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
    async findAll(query, scopeFilter) {
        const { page = 1, limit = 10, search, propertyId, source, status, assignedToEmployeeId, sortBy = 'createdAt', sortOrder = 'desc', } = query;
        const companyId = scopeFilter?.companyId ?? '';
        const where = {
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
        if (propertyId)
            where.propertyId = propertyId;
        if (source)
            where.source = source;
        if (status)
            where.status = status;
        if (assignedToEmployeeId && where.assignedToEmployeeId === undefined) {
            where.assignedToEmployeeId = assignedToEmployeeId;
        }
        const [data, total] = await Promise.all([
            this.prisma.lead.findMany({
                where,
                orderBy: { [(0, sort_by_1.safeSortBy)(sortBy, ALLOWED_SORT, 'createdAt')]: sortOrder },
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
    async findOne(id, scopeFilter) {
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
            throw new common_1.NotFoundException(`Lead with ID ${id} not found`);
        }
        return lead;
    }
    async update(id, dto, companyId, scopeFilter, currentUserRole, currentEmployeeId) {
        const before = await this.findOne(id, scopeFilter);
        if (dto.assignedToEmployeeId !== undefined &&
            dto.assignedToEmployeeId !== before.assignedToEmployeeId) {
            if (dto.assignedToEmployeeId) {
                const assigned = await this.prisma.employee.findFirst({
                    where: { id: dto.assignedToEmployeeId, companyId },
                });
                if (!assigned) {
                    throw new common_1.BadRequestException('Assigned employee not found in your company');
                }
            }
            if ((0, role_scope_util_1.isOwnDataScope)(currentUserRole)) {
                throw new common_1.BadRequestException('Employees cannot reassign leads');
            }
        }
        if (dto.propertyId !== undefined && dto.propertyId !== before.propertyId) {
            const property = await this.prisma.property.findFirst({
                where: { id: dto.propertyId, companyId },
            });
            if (!property) {
                throw new common_1.BadRequestException('Property not found in your company');
            }
        }
        if (dto.customerId !== undefined) {
            if (dto.customerId) {
                const cust = await this.prisma.customer.findFirst({
                    where: { id: dto.customerId, companyId },
                });
                if (!cust) {
                    throw new common_1.BadRequestException('Customer not found in your company');
                }
            }
        }
        const { customerId, ...rest } = dto;
        const updateData = { ...rest };
        if (customerId !== undefined) {
            updateData.convertedToCustomerId = customerId || null;
        }
        const updated = await this.prisma.lead.update({
            where: { id },
            data: updateData,
            include: {
                properties: true,
                employees: {
                    include: { users: true },
                },
                customers: true,
            },
        });
        if (dto.assignedToEmployeeId &&
            dto.assignedToEmployeeId !== before.assignedToEmployeeId) {
            const assignedTo = updated.employees;
            if (assignedTo?.users) {
                this.eventEmitter.emit(notification_events_1.NotificationEvents.LeadAssigned, {
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
    async updateStatus(id, status, companyId, scopeFilter, currentUserRole, currentEmployeeId, lostReason) {
        if (status === client_1.LeadStatus.LOST && !lostReason) {
            throw new common_1.BadRequestException('lostReason is required when status is LOST');
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
                ? async (tx, _entity) => {
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
    async convertToCustomer(id, scopeFilter) {
        const lead = await this.findOne(id, scopeFilter);
        const companyId = scopeFilter?.companyId ?? '';
        if (lead.status === 'CONVERTED' && lead.convertedToCustomerId) {
            throw new common_1.BadRequestException('Lead is already converted to a customer');
        }
        this.transitionService.validate('Lead', lead.status, 'CONVERTED');
        if (lead.propertyId && lead.properties?.status) {
            this.transitionService.validate('Property', lead.properties.status, 'BOOKED');
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
            if (lead.propertyId) {
                await tx.property.update({
                    where: { id: lead.propertyId },
                    data: { status: 'BOOKED' },
                });
            }
            await this.governanceEventPublisher.publish(tx, {
                eventType: events_1.DomainEventTypes.LEAD_STATUS_CHANGED,
                entityType: 'Lead',
                entityId: id,
                companyId,
                payload: {
                    companyId,
                    userId: lead.assignedToEmployeeId || 'system',
                    eventType: events_1.DomainEventTypes.LEAD_STATUS_CHANGED,
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
            this.eventEmitter.emit(notification_events_1.NotificationEvents.LeadConverted, {
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
    async remove(id, companyId) {
        await this.findOne(id, { companyId });
        await this.prisma.lead.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        this.eventEmitter.emit('lead.deleted', { companyId, entityId: id });
        return { success: true };
    }
};
exports.LeadsService = LeadsService;
exports.LeadsService = LeadsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2,
        transition_service_1.TransitionService,
        governance_event_publisher_1.GovernanceEventPublisher])
], LeadsService);
//# sourceMappingURL=leads.service.js.map