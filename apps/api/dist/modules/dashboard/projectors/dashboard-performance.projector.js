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
var DashboardPerformanceProjector_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardPerformanceProjector = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../../../config/prisma.service");
const governance_event_processor_1 = require("../../governance-events/governance-event.processor");
const events_1 = require("../../governance-events/types/events");
let DashboardPerformanceProjector = DashboardPerformanceProjector_1 = class DashboardPerformanceProjector {
    prisma;
    processor;
    constructor(prisma, processor) {
        this.prisma = prisma;
        this.processor = processor;
    }
    async handlePerformanceScoreCalculated(event) {
        await this.processor.process(event, DashboardPerformanceProjector_1.name, async () => {
            const payload = event.payload;
            const companyId = payload.companyId;
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);
            const avgResult = await this.prisma.performanceScore.aggregate({
                where: { companyId },
                _avg: { compositeScore: true },
            });
            const avgPerformanceScore = avgResult._avg?.compositeScore ?? 0;
            const topPerformers = await this.prisma.performanceScore.findMany({
                where: { companyId },
                orderBy: { compositeScore: 'desc' },
                take: 5,
                select: { employeeId: true, compositeScore: true, period: true },
            });
            await this.prisma.dashboardKpiSnapshot.upsert({
                where: { companyId_snapshotDate: { companyId, snapshotDate: today } },
                create: {
                    companyId,
                    snapshotDate: today,
                    avgPerformanceScore,
                    topPerformers: topPerformers,
                    lastProcessedEventId: event.id,
                    lastProcessedCorrelationId: event.correlationId,
                },
                update: {
                    avgPerformanceScore,
                    topPerformers: topPerformers,
                    lastProcessedEventId: event.id,
                    lastProcessedCorrelationId: event.correlationId,
                    lastProjectionUpdate: new Date(),
                },
            });
        });
    }
    async handleManagerRatingRecorded(event) {
        await this.processor.process(event, DashboardPerformanceProjector_1.name, async () => {
            const payload = event.payload;
            const companyId = payload.companyId;
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);
            const avgResult = await this.prisma.performanceScore.aggregate({
                where: { companyId },
                _avg: { compositeScore: true },
            });
            const avgPerformanceScore = avgResult._avg?.compositeScore ?? 0;
            const topPerformers = await this.prisma.performanceScore.findMany({
                where: { companyId },
                orderBy: { compositeScore: 'desc' },
                take: 5,
                select: { employeeId: true, compositeScore: true, period: true },
            });
            await this.prisma.dashboardKpiSnapshot.upsert({
                where: { companyId_snapshotDate: { companyId, snapshotDate: today } },
                create: {
                    companyId,
                    snapshotDate: today,
                    avgPerformanceScore,
                    topPerformers: topPerformers,
                    lastProcessedEventId: event.id,
                    lastProcessedCorrelationId: event.correlationId,
                },
                update: {
                    avgPerformanceScore,
                    topPerformers: topPerformers,
                    lastProcessedEventId: event.id,
                    lastProcessedCorrelationId: event.correlationId,
                    lastProjectionUpdate: new Date(),
                },
            });
        });
    }
};
exports.DashboardPerformanceProjector = DashboardPerformanceProjector;
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.PERFORMANCE_SCORE_CALCULATED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardPerformanceProjector.prototype, "handlePerformanceScoreCalculated", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.MANAGER_RATING_RECORDED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardPerformanceProjector.prototype, "handleManagerRatingRecorded", null);
exports.DashboardPerformanceProjector = DashboardPerformanceProjector = DashboardPerformanceProjector_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        governance_event_processor_1.GovernanceEventProcessor])
], DashboardPerformanceProjector);
//# sourceMappingURL=dashboard-performance.projector.js.map