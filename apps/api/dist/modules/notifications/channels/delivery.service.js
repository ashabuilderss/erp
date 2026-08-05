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
var NotificationDeliveryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationDeliveryService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../../../config/prisma.service");
const email_service_1 = require("./email.service");
const push_service_1 = require("./push.service");
let NotificationDeliveryService = NotificationDeliveryService_1 = class NotificationDeliveryService {
    prisma;
    emailService;
    pushService;
    eventEmitter;
    logger = new common_1.Logger(NotificationDeliveryService_1.name);
    constructor(prisma, emailService, pushService, eventEmitter) {
        this.prisma = prisma;
        this.emailService = emailService;
        this.pushService = pushService;
        this.eventEmitter = eventEmitter;
    }
    async deliver(payload) {
        const user = await this.prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                email: true,
                notificationPreferences: true,
            },
        });
        if (!user)
            return;
        const prefs = user.notificationPreferences ?? {};
        const prefKey = this.typeToPrefKey(payload.type);
        if (prefKey && prefs[prefKey] === false) {
            this.logger.log(`Notification suppressed by user pref: ${payload.type}`);
            return;
        }
        if (prefKey && prefs[`${prefKey}_email`] !== false) {
            this.emailService.send({
                to: user.email,
                subject: payload.title,
                html: `<p>${payload.message}</p>${payload.link ? `<p><a href="${payload.link}">View details</a></p>` : ''}`,
            });
        }
        if (prefKey && prefs[`${prefKey}_push`] !== false) {
            const deviceRegistrations = await this.prisma.deviceRegistration.findMany({
                where: { employees: { users: { id: payload.userId } } },
                select: { id: true, fcmtoken: true },
            });
            for (const device of deviceRegistrations) {
                if (device.fcmtoken) {
                    const data = { type: payload.type };
                    if (payload.link)
                        data.link = payload.link;
                    this.pushService.send({
                        token: device.fcmtoken,
                        title: payload.title,
                        body: payload.message,
                        data,
                    });
                }
            }
        }
    }
    typeToPrefKey(type) {
        const map = {
            LEAD_ASSIGNED: 'lead_assigned',
            LEAD_CONVERTED: 'lead_converted',
            LEAVE_REQUESTED: 'leave_requested',
            LEAVE_APPROVED: 'leave_approved',
            LEAVE_REJECTED: 'leave_rejected',
            SITE_VISIT_SCHEDULED: 'site_visit_scheduled',
            BOOKING_CONFIRMED: 'booking_confirmed',
            EMPLOYEE_INVITED: 'employee_invited',
        };
        return map[type];
    }
};
exports.NotificationDeliveryService = NotificationDeliveryService;
exports.NotificationDeliveryService = NotificationDeliveryService = NotificationDeliveryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService,
        push_service_1.PushService,
        event_emitter_1.EventEmitter2])
], NotificationDeliveryService);
//# sourceMappingURL=delivery.service.js.map