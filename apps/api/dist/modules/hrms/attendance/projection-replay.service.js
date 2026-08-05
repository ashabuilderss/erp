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
exports.ProjectionHealthMonitor = exports.ReplayOrchestrationService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../../../config/prisma.service");
const events_1 = require("../../governance-events/types/events");
const ATTENDANCE_BUSINESS_EVENTS = new Set([
    events_1.DomainEventTypes.ATTENDANCE_PUNCH_RECORDED,
    events_1.DomainEventTypes.ATTENDANCE_SESSION_CLOSED,
    events_1.DomainEventTypes.ATTENDANCE_FINALIZATION_BATCH_STARTED,
    events_1.DomainEventTypes.ATTENDANCE_FINALIZED,
    events_1.DomainEventTypes.ATTENDANCE_FINALIZATION_BATCH_COMPLETED,
    events_1.DomainEventTypes.ATTENDANCE_PERIOD_LOCKED,
    events_1.DomainEventTypes.ATTENDANCE_CORRECTION_REQUESTED,
    events_1.DomainEventTypes.ATTENDANCE_CORRECTION_APPROVED,
    events_1.DomainEventTypes.ATTENDANCE_CORRECTION_REJECTED,
    events_1.DomainEventTypes.LEAVE_REQUESTED,
    events_1.DomainEventTypes.LEAVE_APPROVED,
    events_1.DomainEventTypes.LEAVE_REJECTED,
]);
let ReplayOrchestrationService = class ReplayOrchestrationService {
    prisma;
    eventEmitter;
    constructor(prisma, eventEmitter) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
    }
    async replayAttendanceProjections(companyId) {
        const events = await this.prisma.domainEvent.findMany({
            where: {
                payload: {
                    path: ['companyId'],
                    equals: companyId,
                },
            },
            orderBy: { publishedAt: 'asc' },
        });
        const targetEvents = events.filter((e) => ATTENDANCE_BUSINESS_EVENTS.has(e.eventType));
        const targetIds = targetEvents.map((e) => e.id);
        if (targetIds.length > 0) {
            await this.prisma.processedEvent.deleteMany({
                where: { eventId: { in: targetIds } },
            });
        }
        let replayed = 0;
        for (const event of targetEvents) {
            await this.eventEmitter.emitAsync(event.eventType, event);
            replayed++;
        }
        return { replayed };
    }
};
exports.ReplayOrchestrationService = ReplayOrchestrationService;
exports.ReplayOrchestrationService = ReplayOrchestrationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], ReplayOrchestrationService);
let ProjectionHealthMonitor = class ProjectionHealthMonitor {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAttendanceProjectionLag(companyId) {
        const pendingEvents = await this.prisma.domainEvent.count({
            where: {
                status: { in: ['PENDING', 'FAILED'] },
                payload: {
                    path: ['companyId'],
                    equals: companyId,
                },
                eventType: { in: [...ATTENDANCE_BUSINESS_EVENTS] },
            },
        });
        return {
            companyId,
            pendingBusinessEvents: pendingEvents,
            healthy: pendingEvents === 0,
        };
    }
};
exports.ProjectionHealthMonitor = ProjectionHealthMonitor;
exports.ProjectionHealthMonitor = ProjectionHealthMonitor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProjectionHealthMonitor);
//# sourceMappingURL=projection-replay.service.js.map