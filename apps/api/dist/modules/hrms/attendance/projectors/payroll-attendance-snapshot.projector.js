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
var PayrollAttendanceSnapshotProjector_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollAttendanceSnapshotProjector = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../../../../config/prisma.service");
const governance_event_processor_1 = require("../../../governance-events/governance-event.processor");
const events_1 = require("../../../governance-events/types/events");
let PayrollAttendanceSnapshotProjector = PayrollAttendanceSnapshotProjector_1 = class PayrollAttendanceSnapshotProjector {
    prisma;
    processor;
    constructor(prisma, processor) {
        this.prisma = prisma;
        this.processor = processor;
    }
    async handleAttendanceFinalized(event) {
        await this.processor.process(event, PayrollAttendanceSnapshotProjector_1.name, async () => {
            const payload = event.payload;
            const snapshots = new Map();
            for (const item of payload.finalized ?? []) {
                const current = snapshots.get(item.employeeId) ?? {
                    employeeId: item.employeeId,
                    shiftAssignmentSnapshotId: item.shiftAssignmentSnapshotId,
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
                current.shiftAssignmentSnapshotId =
                    current.shiftAssignmentSnapshotId ?? item.shiftAssignmentSnapshotId;
                snapshots.set(item.employeeId, current);
            }
            for (const snapshot of snapshots.values()) {
                const fullDayMinutes = Number(payload.fullDayMinutes);
                if (!fullDayMinutes || fullDayMinutes <= 0) {
                    continue;
                }
                const snapshotData = {
                    payableMinutes: snapshot.payableMinutes,
                    paidDays: snapshot.payableMinutes / fullDayMinutes,
                    overtimeMinutes: snapshot.overtimeMinutes,
                    lateMinutes: snapshot.lateMinutes,
                    absentDays: snapshot.absentDays,
                    leaveDays: snapshot.leaveDays,
                };
                await this.prisma.payrollAttendanceSnapshot.upsert({
                    where: {
                        companyId_employeeId_attendancePeriodId: {
                            companyId: payload.companyId,
                            employeeId: snapshot.employeeId,
                            attendancePeriodId: payload.attendancePeriodId,
                        },
                    },
                    create: {
                        companyId: payload.companyId,
                        employeeId: snapshot.employeeId,
                        attendancePeriodId: payload.attendancePeriodId,
                        policyVersionId: payload.policyVersionId,
                        shiftAssignmentSnapshotId: snapshot.shiftAssignmentSnapshotId,
                        holidayCalendarVersionId: payload.holidayCalendarVersionId,
                        attendanceFinalizationBatchId: payload.attendanceFinalizationBatchId,
                        snapshotData,
                        lastProcessedEventId: event.id,
                        lastProcessedCorrelationId: event.correlationId,
                    },
                    update: {
                        policyVersionId: payload.policyVersionId,
                        shiftAssignmentSnapshotId: snapshot.shiftAssignmentSnapshotId,
                        holidayCalendarVersionId: payload.holidayCalendarVersionId,
                        attendanceFinalizationBatchId: payload.attendanceFinalizationBatchId,
                        snapshotData,
                        lastProcessedEventId: event.id,
                        lastProcessedCorrelationId: event.correlationId,
                        lastProjectionUpdate: new Date(),
                    },
                });
            }
        });
    }
};
exports.PayrollAttendanceSnapshotProjector = PayrollAttendanceSnapshotProjector;
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.ATTENDANCE_FINALIZED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PayrollAttendanceSnapshotProjector.prototype, "handleAttendanceFinalized", null);
exports.PayrollAttendanceSnapshotProjector = PayrollAttendanceSnapshotProjector = PayrollAttendanceSnapshotProjector_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        governance_event_processor_1.GovernanceEventProcessor])
], PayrollAttendanceSnapshotProjector);
//# sourceMappingURL=payroll-attendance-snapshot.projector.js.map