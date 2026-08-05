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
var DashboardAlertProjector_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardAlertProjector = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../../../config/prisma.service");
const governance_event_processor_1 = require("../../governance-events/governance-event.processor");
const events_1 = require("../../governance-events/types/events");
let DashboardAlertProjector = DashboardAlertProjector_1 = class DashboardAlertProjector {
    prisma;
    processor;
    constructor(prisma, processor) {
        this.prisma = prisma;
        this.processor = processor;
    }
    async handleTaskOverdue(event) {
        await this.processor.process(event, DashboardAlertProjector_1.name, async () => {
            const payload = event.payload;
            await this.createAlert(payload.companyId, 'TASK_OVERDUE', 'WARNING', 'Task Overdue', `Task "${payload.taskTitle ?? 'Unknown'}" is overdue`, event.id, event.correlationId, payload.entityId, 'Task');
        });
    }
    async handleTaskProofRejected(event) {
        await this.processor.process(event, DashboardAlertProjector_1.name, async () => {
            const payload = event.payload;
            await this.createAlert(payload.companyId, 'TASK_PROOF_REJECTED', 'WARNING', 'Task Proof Rejected', `Proof for task was rejected`, event.id, event.correlationId, payload.entityId, 'Task');
        });
    }
    async handlePayrollHoldRecommended(event) {
        await this.processor.process(event, DashboardAlertProjector_1.name, async () => {
            const payload = event.payload;
            await this.createAlert(payload.companyId, 'PAYROLL_HOLD_RECOMMENDED', 'INFO', 'Payroll Hold Recommended', `A payroll hold has been recommended for review`, event.id, event.correlationId, payload.entityId, 'PayrollHold');
        });
    }
    async handleWarningCreated(event) {
        await this.processor.process(event, DashboardAlertProjector_1.name, async () => {
            const payload = event.payload;
            await this.createAlert(payload.companyId, 'WARNING_CREATED', 'WARNING', 'Warning Issued', `A warning has been issued`, event.id, event.correlationId, payload.entityId, 'Warning');
        });
    }
    async handleDisciplinaryReviewTriggered(event) {
        await this.processor.process(event, DashboardAlertProjector_1.name, async () => {
            const payload = event.payload;
            await this.createAlert(payload.companyId, 'DISCIPLINARY_REVIEW', 'CRITICAL', 'Disciplinary Review Triggered', `A disciplinary review has been triggered`, event.id, event.correlationId, payload.entityId, 'Warning');
        });
    }
    async handleOwnerEmergencyHold(event) {
        await this.processor.process(event, DashboardAlertProjector_1.name, async () => {
            const payload = event.payload;
            await this.createAlert(payload.companyId, 'OWNER_EMERGENCY_HOLD', 'CRITICAL', 'Emergency Payroll Hold', `An emergency payroll hold has been activated by the owner`, event.id, event.correlationId, payload.entityId, 'PayrollHold');
        });
    }
    async createAlert(companyId, alertType, severity, title, message, eventId, correlationId, entityId, entityType) {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const existing = await this.prisma.dashboardAlert.findFirst({
            where: { companyId, alertType, entityId, status: 'ACTIVE' },
        });
        if (!existing) {
            await this.prisma.dashboardAlert.create({
                data: {
                    companyId,
                    alertType,
                    severity,
                    title,
                    message,
                    entityId,
                    entityType,
                    status: 'ACTIVE',
                    createdById: 'system',
                },
            });
        }
        const criticalAlerts = await this.prisma.dashboardAlert.count({
            where: { companyId, severity: 'CRITICAL', status: 'ACTIVE' },
        });
        await this.prisma.dashboardKpiSnapshot.upsert({
            where: { companyId_snapshotDate: { companyId, snapshotDate: today } },
            create: {
                companyId,
                snapshotDate: today,
                criticalAlerts,
                lastProcessedEventId: eventId,
                lastProcessedCorrelationId: correlationId,
            },
            update: {
                criticalAlerts,
                lastProcessedEventId: eventId,
                lastProcessedCorrelationId: correlationId,
                lastProjectionUpdate: new Date(),
            },
        });
    }
};
exports.DashboardAlertProjector = DashboardAlertProjector;
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.TASK_OVERDUE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardAlertProjector.prototype, "handleTaskOverdue", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.TASK_PROOF_REJECTED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardAlertProjector.prototype, "handleTaskProofRejected", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.PAYROLL_HOLD_RECOMMENDED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardAlertProjector.prototype, "handlePayrollHoldRecommended", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.WARNING_CREATED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardAlertProjector.prototype, "handleWarningCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.DISCIPLINARY_REVIEW_TRIGGERED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardAlertProjector.prototype, "handleDisciplinaryReviewTriggered", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.OWNER_EMERGENCY_HOLD),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardAlertProjector.prototype, "handleOwnerEmergencyHold", null);
exports.DashboardAlertProjector = DashboardAlertProjector = DashboardAlertProjector_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        governance_event_processor_1.GovernanceEventProcessor])
], DashboardAlertProjector);
//# sourceMappingURL=dashboard-alert.projector.js.map