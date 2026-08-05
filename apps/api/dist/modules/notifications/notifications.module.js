"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsModule = void 0;
const common_1 = require("@nestjs/common");
const notifications_service_1 = require("./notifications.service");
const notifications_controller_1 = require("./notifications.controller");
const notification_listener_1 = require("./notification-listener");
const task_sla_listener_1 = require("./listeners/task-sla.listener");
const notification_router_1 = require("./router/notification-router");
const email_service_1 = require("./channels/email.service");
const push_service_1 = require("./channels/push.service");
const delivery_service_1 = require("./channels/delivery.service");
const prisma_module_1 = require("../../config/prisma.module");
let NotificationsModule = class NotificationsModule {
};
exports.NotificationsModule = NotificationsModule;
exports.NotificationsModule = NotificationsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [notifications_controller_1.NotificationsController],
        providers: [
            notifications_service_1.NotificationsService,
            notification_listener_1.NotificationListener,
            task_sla_listener_1.TaskSlaListener,
            notification_router_1.NotificationRouter,
            email_service_1.EmailService,
            push_service_1.PushService,
            delivery_service_1.NotificationDeliveryService,
        ],
        exports: [notifications_service_1.NotificationsService, delivery_service_1.NotificationDeliveryService],
    })
], NotificationsModule);
//# sourceMappingURL=notifications.module.js.map