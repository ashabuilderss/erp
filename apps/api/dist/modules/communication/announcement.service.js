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
exports.AnnouncementService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../config/prisma.service");
const transition_service_1 = require("../../common/services/transition.service");
const governance_event_publisher_1 = require("../governance-events/governance-event.publisher");
const events_1 = require("../governance-events/types/events");
const notifications_service_1 = require("../notifications/notifications.service");
const audit_service_1 = require("../audit/audit.service");
let AnnouncementService = class AnnouncementService {
    prisma;
    eventPublisher;
    notificationsService;
    auditService;
    transitionService;
    constructor(prisma, eventPublisher, notificationsService, auditService, transitionService) {
        this.prisma = prisma;
        this.eventPublisher = eventPublisher;
        this.notificationsService = notificationsService;
        this.auditService = auditService;
        this.transitionService = transitionService;
    }
    async create(input) {
        const { companyId, title, body, priority, targetRoles, targetEmployees, expiresAt, createdById, } = input;
        const announcementId = await this.prisma.$transaction(async (tx) => {
            const announcement = await tx.announcement.create({
                data: {
                    companyId,
                    title,
                    body,
                    priority: priority ?? 'NORMAL',
                    targetRoles: targetRoles,
                    targetEmployees: targetEmployees,
                    status: client_1.AnnouncementStatus.DRAFT,
                    expiresAt: expiresAt ?? null,
                    createdById,
                },
            });
            await this.eventPublisher.publish(tx, {
                eventType: events_1.DomainEventTypes.ANNOUNCEMENT_CREATED,
                entityId: announcement.id,
                entityType: 'Announcement',
                companyId,
                payload: {
                    companyId,
                    title,
                    body,
                    priority: priority ?? 'NORMAL',
                    targetRoles,
                    targetEmployees,
                    createdById,
                },
            });
            await this.auditService.record({
                tx,
                companyId,
                entityType: 'Announcement',
                entityId: announcement.id,
                action: 'CREATED',
                userId: createdById,
                newState: { title, body, status: 'DRAFT' },
            });
            return announcement.id;
        });
        return announcementId;
    }
    async publish(input) {
        const { companyId, announcementId, userId } = input;
        const announcement = await this.prisma.announcement.findFirst({
            where: { id: announcementId, companyId },
        });
        if (!announcement) {
            throw new common_1.NotFoundException(`Announcement with ID ${announcementId} not found`);
        }
        if (announcement.status !== client_1.AnnouncementStatus.DRAFT) {
            throw new common_1.BadRequestException('Only draft announcements can be published');
        }
        this.transitionService.validate('Announcement', announcement.status, 'PUBLISHED');
        await this.prisma.$transaction(async (tx) => {
            await tx.announcement.update({
                where: { id: announcementId },
                data: {
                    status: client_1.AnnouncementStatus.PUBLISHED,
                    publishedAt: new Date(),
                },
            });
            await this.eventPublisher.publish(tx, {
                eventType: events_1.DomainEventTypes.ANNOUNCEMENT_PUBLISHED,
                entityId: announcementId,
                entityType: 'Announcement',
                companyId,
                payload: {
                    companyId,
                    title: announcement.title,
                    targetRoles: announcement.targetRoles,
                    targetEmployees: announcement.targetEmployees,
                    publishedById: userId,
                },
            });
            await this.auditService.record({
                tx,
                companyId,
                entityType: 'Announcement',
                entityId: announcementId,
                action: 'PUBLISHED',
                userId,
                previousState: { status: 'DRAFT' },
                newState: { status: 'PUBLISHED' },
            });
        });
        await this.sendPublishNotifications(announcement);
    }
    async archive(input) {
        const { companyId, announcementId, userId } = input;
        const announcement = await this.prisma.announcement.findFirst({
            where: { id: announcementId, companyId },
        });
        if (!announcement) {
            throw new common_1.NotFoundException(`Announcement with ID ${announcementId} not found`);
        }
        if (announcement.status !== client_1.AnnouncementStatus.PUBLISHED) {
            throw new common_1.BadRequestException('Only published announcements can be archived');
        }
        this.transitionService.validate('Announcement', announcement.status, 'ARCHIVED');
        await this.prisma.$transaction(async (tx) => {
            await tx.announcement.update({
                where: { id: announcementId },
                data: { status: client_1.AnnouncementStatus.ARCHIVED },
            });
            await this.eventPublisher.publish(tx, {
                eventType: events_1.DomainEventTypes.ANNOUNCEMENT_ARCHIVED,
                entityId: announcementId,
                entityType: 'Announcement',
                companyId,
                payload: {
                    companyId,
                    title: announcement.title,
                    archivedById: userId,
                },
            });
            await this.auditService.record({
                tx,
                companyId,
                entityType: 'Announcement',
                entityId: announcementId,
                action: 'ARCHIVED',
                userId,
                previousState: { status: 'PUBLISHED' },
                newState: { status: 'ARCHIVED' },
            });
        });
    }
    async getAnnouncement(id, companyId) {
        const announcement = await this.prisma.announcement.findFirst({
            where: { id, companyId },
            include: {
                users: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                receipts: {
                    include: {
                        users: { select: { id: true, firstName: true, lastName: true } },
                    },
                },
            },
        });
        if (!announcement) {
            throw new common_1.NotFoundException(`Announcement with ID ${id} not found`);
        }
        return announcement;
    }
    async listAnnouncements(companyId, options) {
        const { page = 1, limit = 10, status } = options;
        const where = { companyId };
        if (status)
            where.status = status;
        const [data, total] = await Promise.all([
            this.prisma.announcement.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    users: { select: { id: true, firstName: true, lastName: true } },
                    _count: { select: { receipts: true } },
                },
            }),
            this.prisma.announcement.count({ where }),
        ]);
        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async getPublishedForEmployee(companyId, employeeId) {
        const employee = await this.prisma.employee.findFirst({
            where: { id: employeeId, companyId },
            include: { users: { select: { role: true } } },
        });
        if (!employee)
            return [];
        const userRole = employee.users?.role ?? 'EMPLOYEE';
        const announcements = await this.prisma.announcement.findMany({
            where: {
                companyId,
                status: client_1.AnnouncementStatus.PUBLISHED,
                OR: [
                    { targetRoles: { array_contains: userRole } },
                    { targetEmployees: { array_contains: employeeId } },
                ],
            },
            orderBy: { publishedAt: 'desc' },
            include: {
                users: { select: { id: true, firstName: true, lastName: true } },
            },
        });
        return announcements;
    }
    async sendPublishNotifications(announcement) {
        const targetEmployeeIds = announcement.targetEmployees;
        const targetRoles = announcement.targetRoles;
        let employeeIds = targetEmployeeIds;
        if (targetRoles.length > 0 && employeeIds.length === 0) {
            const employees = await this.prisma.employee.findMany({
                where: {
                    companyId: announcement.companyId,
                    status: 'ACTIVE',
                    users: { role: { in: targetRoles } },
                },
                select: { id: true, userId: true },
            });
            employeeIds = employees.map((e) => e.id);
        }
        const employeesWithUsers = await this.prisma.employee.findMany({
            where: { id: { in: employeeIds }, companyId: announcement.companyId },
            select: { userId: true },
        });
        for (const emp of employeesWithUsers) {
            if (emp.userId) {
                await this.notificationsService.create({
                    userId: emp.userId,
                    companyId: announcement.companyId,
                    title: announcement.title,
                    message: announcement.body.substring(0, 200),
                    type: 'ANNOUNCEMENT',
                    link: `/dashboard/announcements/${announcement.id}`,
                });
            }
        }
    }
};
exports.AnnouncementService = AnnouncementService;
exports.AnnouncementService = AnnouncementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        governance_event_publisher_1.GovernanceEventPublisher,
        notifications_service_1.NotificationsService,
        audit_service_1.AuditService,
        transition_service_1.TransitionService])
], AnnouncementService);
//# sourceMappingURL=announcement.service.js.map