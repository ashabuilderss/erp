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
exports.BookingsService = void 0;
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
    'bookingDate',
    'amount',
    'status',
    'paymentStatus',
];
let BookingsService = class BookingsService {
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
        const property = await this.prisma.property.findFirst({
            where: { id: dto.propertyId, companyId },
        });
        if (!property) {
            throw new common_1.NotFoundException(`Property with ID ${dto.propertyId} not found`);
        }
        const customer = await this.prisma.customer.findFirst({
            where: { id: dto.customerId, companyId },
        });
        if (!customer) {
            throw new common_1.NotFoundException(`Customer with ID ${dto.customerId} not found`);
        }
        const assignedEmployee = await this.prisma.employee.findFirst({
            where: {
                id: dto.assignedToEmployeeId,
                companyId,
            },
        });
        if (!assignedEmployee) {
            throw new common_1.NotFoundException('Assigned employee not found');
        }
        if (dto.leadId) {
            const lead = await this.prisma.lead.findFirst({
                where: { id: dto.leadId, companyId },
            });
            if (!lead) {
                throw new common_1.NotFoundException(`Lead with ID ${dto.leadId} not found`);
            }
        }
        if ((0, role_scope_util_1.isOwnDataScope)(currentUserRole) &&
            dto.assignedToEmployeeId !== currentEmployeeId) {
            throw new common_1.BadRequestException('Employees can only create bookings assigned to themselves');
        }
        const booking = await this.prisma.$transaction(async (tx) => {
            const currentProperty = await tx.property.findUnique({
                where: { id: dto.propertyId },
            });
            if (currentProperty?.status === 'SOLD') {
                throw new common_1.BadRequestException('Cannot book a property that is already sold');
            }
            if (currentProperty?.status) {
                this.transitionService.validate('Property', currentProperty.status, dto.status === 'CONFIRMED' ? 'BOOKED' : 'RESERVED');
            }
            const activeBooking = await tx.booking.findFirst({
                where: {
                    propertyId: dto.propertyId,
                    companyId,
                    status: { in: ['PENDING', 'CONFIRMED'] },
                },
            });
            if (activeBooking) {
                throw new common_1.BadRequestException('Property already has an active booking');
            }
            const b = await tx.booking.create({
                data: {
                    ...dto,
                    companyId,
                    bookingDate: new Date(dto.bookingDate),
                    amount: new client_1.Prisma.Decimal(dto.amount),
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
            if (dto.status === 'CONFIRMED') {
                await tx.property.update({
                    where: { id: dto.propertyId },
                    data: { status: 'BOOKED' },
                });
            }
            await this.governanceEventPublisher.publish(tx, {
                eventType: events_1.DomainEventTypes.BOOKING_CREATED,
                entityType: 'Booking',
                entityId: b.id,
                companyId,
                payload: {
                    companyId,
                    userId: currentEmployeeId || 'system',
                    eventType: events_1.DomainEventTypes.BOOKING_CREATED,
                    metadata: {
                        bookingAmount: b.amount,
                        propertyTitle: b.properties?.title,
                        customerName: b.customers?.name,
                        status: b.status,
                    },
                },
            });
            return b;
        });
        this.eventEmitter.emit('booking.created', {
            companyId,
            entityId: booking.id,
        });
        return booking;
    }
    async findAll(query, scopeFilter) {
        const { page = 1, limit = 10, search, propertyId, customerId, leadId, status, paymentStatus, bookingDateFrom, bookingDateTo, assignedToEmployeeId, sortBy = 'bookingDate', sortOrder = 'desc', } = query;
        const where = {
            companyId: scopeFilter?.companyId ?? '',
            ...scopeFilter,
        };
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
        if (paymentStatus)
            where.paymentStatus = paymentStatus;
        if (assignedToEmployeeId && where.assignedToEmployeeId === undefined) {
            where.assignedToEmployeeId = assignedToEmployeeId;
        }
        if (bookingDateFrom || bookingDateTo) {
            where.bookingDate = {};
            if (bookingDateFrom)
                where.bookingDate.gte = new Date(bookingDateFrom);
            if (bookingDateTo)
                where.bookingDate.lte = new Date(bookingDateTo);
        }
        const [data, total] = await Promise.all([
            this.prisma.booking.findMany({
                where,
                orderBy: {
                    [(0, sort_by_1.safeSortBy)(sortBy, ALLOWED_SORT, 'bookingDate')]: sortOrder,
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
            this.prisma.booking.count({ where }),
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
        const booking = await this.prisma.booking.findFirst({
            where: {
                id,
                ...scopeFilter,
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
        if (!booking) {
            throw new common_1.NotFoundException(`Booking with ID ${id} not found`);
        }
        return booking;
    }
    async update(id, dto, companyId, scopeFilter, currentUserRole, currentEmployeeId) {
        const existing = await this.findOne(id, scopeFilter);
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
                throw new common_1.BadRequestException('Employees cannot reassign bookings');
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
        const { paymentStatus: _paymentStatus, ...safeDto } = dto;
        const data = { ...safeDto };
        if (dto.bookingDate) {
            data.bookingDate = new Date(dto.bookingDate);
        }
        if (dto.amount !== undefined) {
            data.amount = new client_1.Prisma.Decimal(dto.amount);
        }
        const result = await this.prisma.booking.update({
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
        this.eventEmitter.emit('booking.updated', { companyId, entityId: id });
        return result;
    }
    async updateStatus(id, status, companyId, scopeFilter, currentUserRole, currentEmployeeId) {
        await this.findOne(id, scopeFilter);
        const updated = await this.transitionService.execute({
            entityType: 'Booking',
            id,
            newStatus: status,
            companyId,
            currentUserRole,
            currentEmployeeId,
            before: async (tx, booking) => {
                if (status === 'CONFIRMED' && booking.propertyId) {
                    this.transitionService.validate('Property', booking.properties?.status ?? 'AVAILABLE', 'BOOKED');
                    await tx.property.update({
                        where: { id: booking.propertyId },
                        data: { status: 'BOOKED' },
                    });
                    await this.governanceEventPublisher.publish(tx, {
                        eventType: events_1.DomainEventTypes.BOOKING_CONFIRMED,
                        entityType: 'Booking',
                        entityId: id,
                        companyId,
                        payload: {
                            companyId,
                            userId: currentEmployeeId || 'system',
                            eventType: events_1.DomainEventTypes.BOOKING_CONFIRMED,
                            metadata: {
                                propertyTitle: booking.properties?.title,
                                customerName: booking.customers?.name,
                            },
                        },
                    });
                }
                if (status === 'CANCELLED' && booking.propertyId) {
                    const property = await tx.property.findUnique({
                        where: { id: booking.propertyId },
                    });
                    if (property?.status === 'BOOKED') {
                        const otherActive = await tx.booking.count({
                            where: {
                                propertyId: booking.propertyId,
                                status: { in: ['PENDING', 'CONFIRMED'] },
                                id: { not: id },
                            },
                        });
                        if (otherActive === 0) {
                            this.transitionService.validate('Property', property?.status ?? 'BOOKED', 'AVAILABLE');
                            await tx.property.update({
                                where: { id: booking.propertyId },
                                data: { status: 'AVAILABLE' },
                            });
                        }
                    }
                    await tx.paymentSchedule.updateMany({
                        where: { bookingId: id, status: 'PENDING' },
                        data: { status: 'CANCELLED' },
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
        this.eventEmitter.emit(status === 'CANCELLED' ? 'booking.cancelled' : 'booking.updated', { companyId, entityId: id });
        return updated;
    }
    async updatePaymentStatus(id, paymentStatus, companyId, scopeFilter, currentUserRole, currentEmployeeId) {
        const booking = await this.findOne(id, scopeFilter);
        if ((0, role_scope_util_1.isOwnDataScope)(currentUserRole) &&
            booking.assignedToEmployeeId !== currentEmployeeId) {
            throw new common_1.BadRequestException('Employees can only update payment status of their own bookings');
        }
        if (paymentStatus === 'COMPLETED' && booking.status !== 'CONFIRMED') {
            throw new common_1.BadRequestException('Booking must be CONFIRMED before marking payment as COMPLETED');
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            if (paymentStatus === 'COMPLETED' && booking.propertyId) {
                this.transitionService.validate('Property', booking.properties?.status ?? 'BOOKED', 'SOLD');
                await tx.property.update({
                    where: { id: booking.propertyId },
                    data: { status: 'SOLD' },
                });
            }
            const b = await tx.booking.update({
                where: { id },
                data: { paymentStatus },
                include: {
                    properties: true,
                    customers: true,
                    leads: true,
                    employees: {
                        include: { users: true },
                    },
                },
            });
            if (paymentStatus === 'COMPLETED') {
                await this.governanceEventPublisher.publish(tx, {
                    eventType: events_1.DomainEventTypes.BOOKING_CONFIRMED,
                    entityType: 'Booking',
                    entityId: id,
                    companyId,
                    payload: {
                        companyId,
                        userId: currentEmployeeId || 'system',
                        eventType: events_1.DomainEventTypes.BOOKING_CONFIRMED,
                        metadata: {
                            propertyTitle: b.properties?.title,
                            customerName: b.customers?.name,
                            paymentStatus,
                        },
                    },
                });
            }
            return b;
        });
        this.eventEmitter.emit('booking.updated', { companyId, entityId: id });
        return updated;
    }
    async remove(id, companyId) {
        const booking = await this.findOne(id, { companyId });
        await this.prisma.$transaction(async (tx) => {
            if (booking.propertyId) {
                const property = await tx.property.findUnique({
                    where: { id: booking.propertyId },
                });
                if (property?.status === 'BOOKED') {
                    const otherActive = await tx.booking.count({
                        where: {
                            propertyId: booking.propertyId,
                            status: { in: ['PENDING', 'CONFIRMED'] },
                            id: { not: id },
                        },
                    });
                    if (otherActive === 0) {
                        this.transitionService.validate('Property', property.status, 'AVAILABLE');
                        await tx.property.update({
                            where: { id: booking.propertyId },
                            data: { status: 'AVAILABLE' },
                        });
                    }
                }
            }
            await tx.paymentSchedule.updateMany({
                where: { bookingId: id, status: 'PENDING' },
                data: { status: 'CANCELLED' },
            });
            await tx.booking.update({ where: { id }, data: { deletedAt: new Date() } });
        });
        this.eventEmitter.emit('booking.deleted', { companyId, entityId: id });
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2,
        transition_service_1.TransitionService,
        governance_event_publisher_1.GovernanceEventPublisher])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map