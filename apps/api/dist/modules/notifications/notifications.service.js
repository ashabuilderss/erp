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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../../config/prisma.service");
const notification_events_1 = require("./events/notification-events");
const sort_by_1 = require("../../common/utils/sort-by");
const realtime_gateway_1 = require("../../common/realtime/realtime.gateway");
const delivery_service_1 = require("./channels/delivery.service");
const ALLOWED_SORT = [
    'createdAt',
    'updatedAt',
    'title',
    'type',
    'read',
];
let NotificationsService = class NotificationsService {
    prisma;
    eventEmitter;
    deliveryService;
    realtimeGateway;
    constructor(prisma, eventEmitter, deliveryService, realtimeGateway) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
        this.deliveryService = deliveryService;
        this.realtimeGateway = realtimeGateway;
    }
    typeToPrefKey = {
        LEAD_ASSIGNED: 'lead_assigned',
        LEAD_CONVERTED: 'lead_converted',
        LEAVE_REQUESTED: 'leave_requested',
        LEAVE_APPROVED: 'leave_approved',
        LEAVE_REJECTED: 'leave_rejected',
        SITE_VISIT_SCHEDULED: 'site_visit_scheduled',
        BOOKING_CONFIRMED: 'booking_confirmed',
        EMPLOYEE_INVITED: 'employee_invited',
    };
    async create(dto) {
        const type = dto.type ?? 'INFO';
        const prefKey = this.typeToPrefKey[type];
        if (prefKey) {
            const user = await this.prisma.user.findUnique({
                where: { id: dto.userId },
                select: { notificationPreferences: true },
            });
            const prefs = user?.notificationPreferences;
            if (prefs && prefs[prefKey] === false)
                return null;
        }
        const notification = await this.prisma.notification.create({
            data: {
                userId: dto.userId,
                companyId: dto.companyId,
                title: dto.title,
                message: dto.message,
                type,
                link: dto.link,
            },
        });
        this.eventEmitter.emit(notification_events_1.NotificationEvents.NotificationCreated, notification);
        this.deliveryService
            .deliver({
            userId: dto.userId,
            companyId: dto.companyId,
            title: dto.title,
            message: dto.message,
            type,
            link: dto.link,
        })
            .catch((err) => {
            console.error('Failed to deliver notification', err);
        });
        return notification;
    }
    async findAll(query, userId) {
        const { page = 1, limit = 20, read, acknowledged, type, sortBy = 'createdAt', sortOrder = 'desc', } = query;
        const where = { userId };
        if (read !== undefined)
            where.read = read === 'true';
        if (acknowledged !== undefined) {
            where.acknowledgedAt = acknowledged === 'true' ? { not: null } : null;
        }
        if (type)
            where.type = type;
        const [data, total] = await Promise.all([
            this.prisma.notification.findMany({
                where,
                orderBy: { [(0, sort_by_1.safeSortBy)(sortBy, ALLOWED_SORT, 'createdAt')]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.notification.count({ where }),
        ]);
        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async getUnreadCount(userId) {
        return this.prisma.notification.count({
            where: { userId, read: false },
        });
    }
    async getUnacknowledgedCount(userId) {
        return this.prisma.notification.count({
            where: { userId, acknowledgedAt: null },
        });
    }
    async acknowledge(id, userId) {
        const notification = await this.prisma.notification.findFirst({
            where: { id, userId },
        });
        if (!notification) {
            throw new common_1.NotFoundException(`Notification with ID ${id} not found`);
        }
        return this.prisma.notification.update({
            where: { id },
            data: { read: true, acknowledgedAt: new Date() },
        });
    }
    async markAsRead(id, userId) {
        const notification = await this.prisma.notification.findFirst({
            where: { id, userId },
        });
        if (!notification)
            throw new common_1.NotFoundException(`Notification with ID ${id} not found`);
        return this.prisma.notification.update({
            where: { id },
            data: { read: true },
        });
    }
    async markAllAsRead(userId) {
        await this.prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true },
        });
        return { success: true };
    }
    pushToUser(userId, data) {
        this.realtimeGateway.broadcastToUser(userId, 'notification', data);
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2,
        delivery_service_1.NotificationDeliveryService,
        realtime_gateway_1.RealtimeGateway])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map