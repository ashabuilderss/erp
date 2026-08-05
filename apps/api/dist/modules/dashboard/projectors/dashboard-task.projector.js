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
var DashboardTaskProjector_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardTaskProjector = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../../../config/prisma.service");
const governance_event_processor_1 = require("../../governance-events/governance-event.processor");
const events_1 = require("../../governance-events/types/events");
let DashboardTaskProjector = DashboardTaskProjector_1 = class DashboardTaskProjector {
    prisma;
    processor;
    constructor(prisma, processor) {
        this.prisma = prisma;
        this.processor = processor;
    }
    async handleTaskCreated(event) {
        await this.processor.process(event, DashboardTaskProjector_1.name, async () => {
            const payload = event.payload;
            const companyId = payload.companyId;
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);
            const overdueTasks = await this.prisma.task.count({
                where: {
                    companyId,
                    status: { notIn: ['COMPLETED', 'OVERDUE'] },
                    dueDate: { lt: today },
                },
            });
            await this.prisma.dashboardKpiSnapshot.upsert({
                where: { companyId_snapshotDate: { companyId, snapshotDate: today } },
                create: {
                    companyId,
                    snapshotDate: today,
                    overdueTasks,
                    lastProcessedEventId: event.id,
                    lastProcessedCorrelationId: event.correlationId,
                },
                update: {
                    overdueTasks,
                    lastProcessedEventId: event.id,
                    lastProcessedCorrelationId: event.correlationId,
                    lastProjectionUpdate: new Date(),
                },
            });
        });
    }
    async handleTaskCompleted(event) {
        await this.processor.process(event, DashboardTaskProjector_1.name, async () => {
            const payload = event.payload;
            const companyId = payload.companyId;
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);
            const overdueTasks = await this.prisma.task.count({
                where: {
                    companyId,
                    status: { notIn: ['COMPLETED', 'OVERDUE'] },
                    dueDate: { lt: today },
                },
            });
            await this.prisma.dashboardKpiSnapshot.upsert({
                where: { companyId_snapshotDate: { companyId, snapshotDate: today } },
                create: {
                    companyId,
                    snapshotDate: today,
                    overdueTasks,
                    lastProcessedEventId: event.id,
                    lastProcessedCorrelationId: event.correlationId,
                },
                update: {
                    overdueTasks,
                    lastProcessedEventId: event.id,
                    lastProcessedCorrelationId: event.correlationId,
                    lastProjectionUpdate: new Date(),
                },
            });
        });
    }
};
exports.DashboardTaskProjector = DashboardTaskProjector;
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.TASK_CREATED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardTaskProjector.prototype, "handleTaskCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.TASK_COMPLETED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardTaskProjector.prototype, "handleTaskCompleted", null);
exports.DashboardTaskProjector = DashboardTaskProjector = DashboardTaskProjector_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        governance_event_processor_1.GovernanceEventProcessor])
], DashboardTaskProjector);
//# sourceMappingURL=dashboard-task.projector.js.map