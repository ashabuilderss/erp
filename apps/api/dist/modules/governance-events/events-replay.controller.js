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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EventsReplayController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsReplayController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../config/prisma.service");
const event_emitter_1 = require("@nestjs/event-emitter");
let EventsReplayController = EventsReplayController_1 = class EventsReplayController {
    prisma;
    eventEmitter;
    logger = new common_1.Logger(EventsReplayController_1.name);
    constructor(prisma, eventEmitter) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
    }
    async replayEvent(id, req) {
        const event = await this.prisma.domainEvent.findUnique({
            where: { id },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        if (event.status !== client_1.EventStatus.FAILED &&
            event.status !== client_1.EventStatus.DEAD_LETTER) {
            throw new common_1.BadRequestException('Only FAILED or DEAD_LETTER events can be replayed');
        }
        await this.prisma.securityEvent.create({
            data: {
                eventType: 'EVENT_REPLAYED',
                severity: 'warning',
                userId: req.user.id,
                companyId: req.user.companyId,
                description: `Event ${id} (${event.correlationId}) replayed by ${req.user.id}`,
            },
        });
        await this.prisma.domainEvent.update({
            where: { id },
            data: {
                status: client_1.EventStatus.PENDING,
                attemptCount: 0,
                lastError: null,
            },
        });
        return { success: true, message: 'Event successfully requeued' };
    }
    async replayHandler(eventId, handlerName, req) {
        const processedEvent = await this.prisma.processedEvent.findUnique({
            where: { eventId_handlerName: { eventId, handlerName } },
        });
        if (!processedEvent) {
            throw new common_1.NotFoundException('Processed event not found');
        }
        if (processedEvent.status !== 'FAILED' &&
            processedEvent.status !== 'DEAD_LETTER') {
            throw new common_1.BadRequestException('Only FAILED or DEAD_LETTER handlers can be replayed');
        }
        const domainEvent = await this.prisma.domainEvent.findUnique({
            where: { id: eventId },
        });
        if (!domainEvent) {
            throw new common_1.NotFoundException('Original DomainEvent not found');
        }
        await this.prisma.processedEvent.update({
            where: { eventId_handlerName: { eventId, handlerName } },
            data: {
                status: 'FAILED',
                retryCount: 0,
                lastError: null,
                nextRetryAt: new Date(),
            },
        });
        await this.prisma.securityEvent.create({
            data: {
                eventType: 'EVENT_HANDLER_REPLAYED',
                severity: 'warning',
                userId: req.user.id,
                companyId: req.user.companyId,
                description: JSON.stringify({
                    eventId,
                    handlerName,
                    actorId: req.user.id,
                    correlationId: domainEvent.correlationId,
                    timestamp: new Date().toISOString(),
                }),
            },
        });
        this.logger.log(`Handler replay requested: ${handlerName} for event ${eventId} (correlationId: ${domainEvent.correlationId})`);
        this.eventEmitter.emit(domainEvent.eventType, domainEvent);
        return { success: true, message: 'Handler replay initiated successfully' };
    }
};
exports.EventsReplayController = EventsReplayController;
__decorate([
    (0, common_1.Post)(':id/replay'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventsReplayController.prototype, "replayEvent", null);
__decorate([
    (0, common_1.Post)('handlers/:eventId/:handlerName/replay'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER),
    __param(0, (0, common_1.Param)('eventId')),
    __param(1, (0, common_1.Param)('handlerName')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], EventsReplayController.prototype, "replayHandler", null);
exports.EventsReplayController = EventsReplayController = EventsReplayController_1 = __decorate([
    (0, common_1.Controller)('internal/events'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], EventsReplayController);
//# sourceMappingURL=events-replay.controller.js.map