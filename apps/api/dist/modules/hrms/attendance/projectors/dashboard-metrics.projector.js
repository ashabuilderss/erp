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
var DashboardMetricsProjector_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardMetricsProjector = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../../../../config/prisma.service");
const governance_event_processor_1 = require("../../../governance-events/governance-event.processor");
const events_1 = require("../../../governance-events/types/events");
const employees_service_1 = require("../../employees/employees.service");
const leave_requests_service_1 = require("../../leave-requests/leave-requests.service");
let DashboardMetricsProjector = DashboardMetricsProjector_1 = class DashboardMetricsProjector {
    prisma;
    processor;
    employeesService;
    leaveRequestsService;
    constructor(prisma, processor, employeesService, leaveRequestsService) {
        this.prisma = prisma;
        this.processor = processor;
        this.employeesService = employeesService;
        this.leaveRequestsService = leaveRequestsService;
    }
    async handleAttendanceFinalized(event) {
        await this.processor.process(event, DashboardMetricsProjector_1.name, async () => {
            const payload = event.payload;
            const byDate = new Map();
            for (const item of payload.finalized ?? []) {
                const snapshotDate = new Date(item.date);
                snapshotDate.setUTCHours(0, 0, 0, 0);
                const key = snapshotDate.toISOString();
                const current = byDate.get(key) ?? {
                    snapshotDate,
                    presentEmployees: 0,
                    absentEmployees: 0,
                    lateEmployees: 0,
                };
                current.presentEmployees += item.result.isAbsent ? 0 : 1;
                current.absentEmployees += item.result.isAbsent ? 1 : 0;
                current.lateEmployees += item.result.lateMinutes > 0 ? 1 : 0;
                byDate.set(key, current);
            }
            const totalEmployees = await this.employeesService.countActive(payload.companyId);
            for (const metrics of byDate.values()) {
                await this.prisma.dashboardMetricsSnapshot.upsert({
                    where: {
                        companyId_snapshotDate: {
                            companyId: payload.companyId,
                            snapshotDate: metrics.snapshotDate,
                        },
                    },
                    create: {
                        companyId: payload.companyId,
                        snapshotDate: metrics.snapshotDate,
                        totalEmployees,
                        presentEmployees: metrics.presentEmployees,
                        absentEmployees: metrics.absentEmployees,
                        lateEmployees: metrics.lateEmployees,
                        lastProcessedEventId: event.id,
                        lastProcessedCorrelationId: event.correlationId,
                    },
                    update: {
                        totalEmployees,
                        presentEmployees: metrics.presentEmployees,
                        absentEmployees: metrics.absentEmployees,
                        lateEmployees: metrics.lateEmployees,
                        lastProcessedEventId: event.id,
                        lastProcessedCorrelationId: event.correlationId,
                        lastProjectionUpdate: new Date(),
                    },
                });
                await this.prisma.dashboardKpiSnapshot.upsert({
                    where: {
                        companyId_snapshotDate: {
                            companyId: payload.companyId,
                            snapshotDate: metrics.snapshotDate,
                        },
                    },
                    create: {
                        companyId: payload.companyId,
                        snapshotDate: metrics.snapshotDate,
                        totalEmployees,
                        presentEmployees: metrics.presentEmployees,
                        absentEmployees: metrics.absentEmployees,
                        lateEmployees: metrics.lateEmployees,
                        lastProcessedEventId: event.id,
                        lastProcessedCorrelationId: event.correlationId,
                    },
                    update: {
                        totalEmployees,
                        presentEmployees: metrics.presentEmployees,
                        absentEmployees: metrics.absentEmployees,
                        lateEmployees: metrics.lateEmployees,
                        lastProcessedEventId: event.id,
                        lastProcessedCorrelationId: event.correlationId,
                        lastProjectionUpdate: new Date(),
                    },
                });
            }
        });
    }
    async handleLeaveApproved(event) {
        await this.processor.process(event, DashboardMetricsProjector_1.name, async () => {
            const payload = event.payload;
            const companyId = payload.companyId;
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);
            const onLeaveToday = await this.leaveRequestsService.countApprovedLeaves(companyId, today);
            await this.prisma.dashboardKpiSnapshot.upsert({
                where: {
                    companyId_snapshotDate: {
                        companyId,
                        snapshotDate: today,
                    },
                },
                create: {
                    companyId,
                    snapshotDate: today,
                    onLeaveToday,
                    lastProcessedEventId: event.id,
                    lastProcessedCorrelationId: event.correlationId,
                },
                update: {
                    onLeaveToday,
                    lastProcessedEventId: event.id,
                    lastProcessedCorrelationId: event.correlationId,
                    lastProjectionUpdate: new Date(),
                },
            });
        });
    }
};
exports.DashboardMetricsProjector = DashboardMetricsProjector;
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.ATTENDANCE_FINALIZED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardMetricsProjector.prototype, "handleAttendanceFinalized", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.LEAVE_APPROVED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardMetricsProjector.prototype, "handleLeaveApproved", null);
exports.DashboardMetricsProjector = DashboardMetricsProjector = DashboardMetricsProjector_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        governance_event_processor_1.GovernanceEventProcessor,
        employees_service_1.EmployeesService,
        leave_requests_service_1.LeaveRequestsService])
], DashboardMetricsProjector);
//# sourceMappingURL=dashboard-metrics.projector.js.map