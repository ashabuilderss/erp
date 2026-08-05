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
var PerformanceProjector_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceProjector = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../../config/prisma.service");
const governance_event_processor_1 = require("../governance-events/governance-event.processor");
const events_1 = require("../governance-events/types/events");
let PerformanceProjector = PerformanceProjector_1 = class PerformanceProjector {
    prisma;
    processor;
    constructor(prisma, processor) {
        this.prisma = prisma;
        this.processor = processor;
    }
    async handlePerformanceScoreCalculated(event) {
        await this.processor.process(event, PerformanceProjector_1.name, async () => {
            const payload = event.payload;
            await this.prisma.performanceTrendSnapshot.upsert({
                where: {
                    companyId_employeeId_periodType_period: {
                        companyId: payload.companyId,
                        employeeId: payload.employeeId,
                        periodType: payload.periodType,
                        period: payload.period,
                    },
                },
                create: {
                    companyId: payload.companyId,
                    employeeId: payload.employeeId,
                    periodType: payload.periodType,
                    period: payload.period,
                    compositeScore: payload.compositeScore,
                    trend: payload.trend,
                    taskScore: payload.taskScore,
                    attendanceScore: payload.attendanceScore,
                    eodScore: payload.eodScore,
                    managerScore: payload.managerScore,
                    previousCompositeScore: payload.scoreDelta !== null
                        ? payload.compositeScore - payload.scoreDelta
                        : null,
                    scoreDelta: payload.scoreDelta,
                    lastProcessedEventId: event.id,
                    lastProcessedCorrelationId: event.correlationId,
                },
                update: {
                    compositeScore: payload.compositeScore,
                    trend: payload.trend,
                    taskScore: payload.taskScore,
                    attendanceScore: payload.attendanceScore,
                    eodScore: payload.eodScore,
                    managerScore: payload.managerScore,
                    previousCompositeScore: payload.scoreDelta !== null
                        ? payload.compositeScore - payload.scoreDelta
                        : null,
                    scoreDelta: payload.scoreDelta,
                    lastProcessedEventId: event.id,
                    lastProcessedCorrelationId: event.correlationId,
                    lastProjectionUpdate: new Date(),
                },
            });
        });
    }
    async handleManagerRatingRecorded(event) {
        await this.processor.process(event, PerformanceProjector_1.name, async () => {
            const payload = event.payload;
            const performanceScore = await this.prisma.performanceScore.findUnique({
                where: { id: payload.performanceScoreId },
            });
            if (!performanceScore)
                return;
            await this.prisma.performanceTrendSnapshot.upsert({
                where: {
                    companyId_employeeId_periodType_period: {
                        companyId: payload.companyId,
                        employeeId: performanceScore.employeeId,
                        periodType: performanceScore.periodType,
                        period: performanceScore.period,
                    },
                },
                create: {
                    companyId: payload.companyId,
                    employeeId: performanceScore.employeeId,
                    periodType: performanceScore.periodType,
                    period: performanceScore.period,
                    compositeScore: payload.newCompositeScore,
                    trend: payload.newTrend,
                    taskScore: payload.taskScore,
                    attendanceScore: payload.attendanceScore,
                    eodScore: payload.eodScore,
                    managerScore: payload.newManagerScore,
                    lastProcessedEventId: event.id,
                    lastProcessedCorrelationId: event.correlationId,
                },
                update: {
                    compositeScore: payload.newCompositeScore,
                    trend: payload.newTrend,
                    taskScore: payload.taskScore,
                    attendanceScore: payload.attendanceScore,
                    eodScore: payload.eodScore,
                    managerScore: payload.newManagerScore,
                    lastProcessedEventId: event.id,
                    lastProcessedCorrelationId: event.correlationId,
                    lastProjectionUpdate: new Date(),
                },
            });
        });
    }
};
exports.PerformanceProjector = PerformanceProjector;
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.PERFORMANCE_SCORE_CALCULATED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PerformanceProjector.prototype, "handlePerformanceScoreCalculated", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.MANAGER_RATING_RECORDED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PerformanceProjector.prototype, "handleManagerRatingRecorded", null);
exports.PerformanceProjector = PerformanceProjector = PerformanceProjector_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        governance_event_processor_1.GovernanceEventProcessor])
], PerformanceProjector);
//# sourceMappingURL=performance.projector.js.map