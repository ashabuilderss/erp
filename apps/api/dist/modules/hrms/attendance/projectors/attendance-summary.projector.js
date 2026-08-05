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
var AttendanceSummaryProjector_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceSummaryProjector = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../../../../config/prisma.service");
const governance_event_processor_1 = require("../../../governance-events/governance-event.processor");
const events_1 = require("../../../governance-events/types/events");
let AttendanceSummaryProjector = AttendanceSummaryProjector_1 = class AttendanceSummaryProjector {
    prisma;
    processor;
    constructor(prisma, processor) {
        this.prisma = prisma;
        this.processor = processor;
    }
    async handleAttendanceFinalized(event) {
        await this.processor.process(event, AttendanceSummaryProjector_1.name, async () => {
            const payload = event.payload;
            const summaries = new Map();
            for (const item of payload.finalized ?? []) {
                const current = summaries.get(item.employeeId) ?? {
                    employeeId: item.employeeId,
                    payableMinutes: 0,
                    overtimeMinutes: 0,
                    lateMinutes: 0,
                    absentDays: 0,
                    leaveDays: 0,
                };
                current.payableMinutes += item.result.payableMinutes ?? 0;
                current.overtimeMinutes += item.result.overtimeMinutes ?? 0;
                current.lateMinutes += item.result.lateMinutes ?? 0;
                current.absentDays += item.result.isAbsent ? 1 : 0;
                current.leaveDays += item.result.leaveMinutes > 0 ? 1 : 0;
                summaries.set(item.employeeId, current);
            }
            for (const summary of summaries.values()) {
                await this.prisma.attendanceSummary.upsert({
                    where: {
                        companyId_employeeId_attendancePeriodId: {
                            companyId: payload.companyId,
                            employeeId: summary.employeeId,
                            attendancePeriodId: payload.attendancePeriodId,
                        },
                    },
                    create: {
                        companyId: payload.companyId,
                        employeeId: summary.employeeId,
                        attendancePeriodId: payload.attendancePeriodId,
                        policyVersionId: payload.policyVersionId,
                        attendanceFinalizationBatchId: payload.attendanceFinalizationBatchId,
                        payableMinutes: summary.payableMinutes,
                        overtimeMinutes: summary.overtimeMinutes,
                        lateMinutes: summary.lateMinutes,
                        absentDays: summary.absentDays,
                        leaveDays: summary.leaveDays,
                        lastProcessedEventId: event.id,
                        lastProcessedCorrelationId: event.correlationId,
                    },
                    update: {
                        policyVersionId: payload.policyVersionId,
                        attendanceFinalizationBatchId: payload.attendanceFinalizationBatchId,
                        payableMinutes: summary.payableMinutes,
                        overtimeMinutes: summary.overtimeMinutes,
                        lateMinutes: summary.lateMinutes,
                        absentDays: summary.absentDays,
                        leaveDays: summary.leaveDays,
                        lastProcessedEventId: event.id,
                        lastProcessedCorrelationId: event.correlationId,
                        lastProjectionUpdate: new Date(),
                    },
                });
            }
        });
    }
};
exports.AttendanceSummaryProjector = AttendanceSummaryProjector;
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.ATTENDANCE_FINALIZED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AttendanceSummaryProjector.prototype, "handleAttendanceFinalized", null);
exports.AttendanceSummaryProjector = AttendanceSummaryProjector = AttendanceSummaryProjector_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        governance_event_processor_1.GovernanceEventProcessor])
], AttendanceSummaryProjector);
//# sourceMappingURL=attendance-summary.projector.js.map