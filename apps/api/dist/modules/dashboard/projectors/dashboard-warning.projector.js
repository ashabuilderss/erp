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
var DashboardWarningProjector_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardWarningProjector = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../../../config/prisma.service");
const governance_event_processor_1 = require("../../governance-events/governance-event.processor");
const events_1 = require("../../governance-events/types/events");
let DashboardWarningProjector = DashboardWarningProjector_1 = class DashboardWarningProjector {
    prisma;
    processor;
    constructor(prisma, processor) {
        this.prisma = prisma;
        this.processor = processor;
    }
    async handleWarningCreated(event) {
        await this.processor.process(event, DashboardWarningProjector_1.name, async () => {
            const payload = event.payload;
            const companyId = payload.companyId;
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);
            const activeWarnings = await this.prisma.warning.count({
                where: { companyId, status: 'PENDING' },
            });
            await this.prisma.dashboardKpiSnapshot.upsert({
                where: { companyId_snapshotDate: { companyId, snapshotDate: today } },
                create: {
                    companyId,
                    snapshotDate: today,
                    activeWarnings,
                    lastProcessedEventId: event.id,
                    lastProcessedCorrelationId: event.correlationId,
                },
                update: {
                    activeWarnings,
                    lastProcessedEventId: event.id,
                    lastProcessedCorrelationId: event.correlationId,
                    lastProjectionUpdate: new Date(),
                },
            });
        });
    }
    async handleWarningApproved(event) {
        await this.processor.process(event, DashboardWarningProjector_1.name, async () => {
            const payload = event.payload;
            const companyId = payload.companyId;
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);
            const activeWarnings = await this.prisma.warning.count({
                where: { companyId, status: 'PENDING' },
            });
            await this.prisma.dashboardKpiSnapshot.upsert({
                where: { companyId_snapshotDate: { companyId, snapshotDate: today } },
                create: {
                    companyId,
                    snapshotDate: today,
                    activeWarnings,
                    lastProcessedEventId: event.id,
                    lastProcessedCorrelationId: event.correlationId,
                },
                update: {
                    activeWarnings,
                    lastProcessedEventId: event.id,
                    lastProcessedCorrelationId: event.correlationId,
                    lastProjectionUpdate: new Date(),
                },
            });
        });
    }
    async handleWarningRejected(event) {
        await this.processor.process(event, DashboardWarningProjector_1.name, async () => {
            const payload = event.payload;
            const companyId = payload.companyId;
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);
            const activeWarnings = await this.prisma.warning.count({
                where: { companyId, status: 'PENDING' },
            });
            await this.prisma.dashboardKpiSnapshot.upsert({
                where: { companyId_snapshotDate: { companyId, snapshotDate: today } },
                create: {
                    companyId,
                    snapshotDate: today,
                    activeWarnings,
                    lastProcessedEventId: event.id,
                    lastProcessedCorrelationId: event.correlationId,
                },
                update: {
                    activeWarnings,
                    lastProcessedEventId: event.id,
                    lastProcessedCorrelationId: event.correlationId,
                    lastProjectionUpdate: new Date(),
                },
            });
        });
    }
};
exports.DashboardWarningProjector = DashboardWarningProjector;
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.WARNING_CREATED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardWarningProjector.prototype, "handleWarningCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.WARNING_APPROVED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardWarningProjector.prototype, "handleWarningApproved", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.WARNING_REJECTED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardWarningProjector.prototype, "handleWarningRejected", null);
exports.DashboardWarningProjector = DashboardWarningProjector = DashboardWarningProjector_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        governance_event_processor_1.GovernanceEventProcessor])
], DashboardWarningProjector);
//# sourceMappingURL=dashboard-warning.projector.js.map