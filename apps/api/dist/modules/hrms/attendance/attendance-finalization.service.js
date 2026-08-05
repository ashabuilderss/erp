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
exports.AttendanceFinalizationService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../config/prisma.service");
const transition_service_1 = require("../../../common/services/transition.service");
const governance_event_publisher_1 = require("../../governance-events/governance-event.publisher");
const events_1 = require("../../governance-events/types/events");
const attendance_policy_engine_1 = require("./attendance-policy.engine");
const attendance_history_service_1 = require("./attendance-history.service");
let AttendanceFinalizationService = class AttendanceFinalizationService {
    prisma;
    eventPublisher;
    policyEngine;
    historyService;
    transitionService;
    constructor(prisma, eventPublisher, policyEngine, historyService, transitionService) {
        this.prisma = prisma;
        this.eventPublisher = eventPublisher;
        this.policyEngine = policyEngine;
        this.historyService = historyService;
        this.transitionService = transitionService;
    }
    async finalizePeriod(input) {
        return this.prisma.$transaction(async (tx) => {
            const period = await tx.attendancePeriod.findFirst({
                where: { id: input.attendancePeriodId, companyId: input.companyId },
            });
            if (!period) {
                throw new common_1.NotFoundException('Attendance period not found');
            }
            if (period.status === 'PAYROLL_LOCKED') {
                throw new common_1.BadRequestException('Attendance period is payroll locked. Use adjustment workflows.');
            }
            const policyVersion = await tx.attendancePolicyVersion.findFirst({
                where: {
                    companyId: input.companyId,
                    effectiveFrom: { lte: period.endDate },
                    OR: [
                        { effectiveTo: null },
                        { effectiveTo: { gte: period.startDate } },
                    ],
                },
                orderBy: { versionNumber: 'desc' },
            });
            if (!policyVersion) {
                throw new common_1.NotFoundException('Attendance policy version not found');
            }
            const holidayVersion = await tx.holidayCalendarVersion.findFirst({
                where: { companyId: input.companyId },
                orderBy: { versionNumber: 'desc' },
            });
            if (!holidayVersion) {
                throw new common_1.NotFoundException('Holiday calendar version not found');
            }
            const batch = await tx.attendanceFinalizationBatch.create({
                data: {
                    companyId: input.companyId,
                    attendancePeriodId: input.attendancePeriodId,
                    policyVersionId: policyVersion.id,
                    holidayCalendarVersionId: holidayVersion.id,
                    finalizedById: input.finalizedById,
                    status: client_1.BatchStatus.PROCESSING,
                },
            });
            await this.eventPublisher.publish(tx, {
                eventType: events_1.DomainEventTypes.ATTENDANCE_FINALIZATION_BATCH_STARTED,
                entityId: batch.id,
                entityType: 'AttendanceFinalizationBatch',
                companyId: input.companyId,
                payload: {
                    companyId: input.companyId,
                    attendancePeriodId: input.attendancePeriodId,
                    attendanceFinalizationBatchId: batch.id,
                },
            });
            await this.historyService.record({
                tx,
                companyId: input.companyId,
                targetType: 'AttendancePeriod',
                targetId: input.attendancePeriodId,
                actorId: input.finalizedById,
                transitionType: 'FINALIZATION_STARTED',
                previousState: period.status,
                newState: 'UNDER_REVIEW',
            });
            const aggregates = await tx.attendanceDayAggregate.findMany({
                where: {
                    companyId: input.companyId,
                    date: { gte: period.startDate, lte: period.endDate },
                },
                include: {
                    attendanceSessions: {
                        include: { shiftAssignmentSnapshots: true },
                    },
                },
            });
            const leaves = await tx.leaveRequest.findMany({
                where: {
                    companyId: input.companyId,
                    status: 'APPROVED',
                    startDate: { lte: period.endDate },
                    endDate: { gte: period.startDate },
                },
            });
            const policy = this.parsePolicy(policyVersion.policyConfiguration);
            const holidayDates = this.parseHolidayDates(holidayVersion.calendarData);
            const weeklyOffDays = this.parseWeeklyOffDays(policyVersion.policyConfiguration);
            const overridesMap = new Map((input.correctionOverrides ?? []).map((o) => [o.dayAggregateId, o]));
            const eligibleAggregates = aggregates.filter((aggregate) => aggregate.status === client_1.DayAggregateStatus.VERIFIED ||
                aggregate.status === client_1.DayAggregateStatus.COMPLETED ||
                overridesMap.has(aggregate.id));
            const finalized = eligibleAggregates.map((aggregate) => {
                const shift = aggregate.attendanceSessions[0]?.shiftAssignmentSnapshots;
                const employeeLeaves = leaves.filter((leave) => leave.employeeId === aggregate.employeeId);
                const approvedLeaveMinutes = employeeLeaves.length > 0 ? policy.fullDayMinutes : 0;
                const dateStr = aggregate.date.toISOString().slice(0, 10);
                const dayOfWeek = aggregate.date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    timeZone: 'UTC',
                });
                const isHoliday = holidayDates.has(dateStr);
                const isWeeklyOff = weeklyOffDays.has(dayOfWeek);
                let workMinutes = aggregate.totalWorkMinutes;
                let firstPunchAt = aggregate.firstPunchAt;
                let lastPunchAt = aggregate.lastPunchAt;
                const override = overridesMap.get(aggregate.id);
                if (override) {
                    if (override.requestedCheckIn) {
                        firstPunchAt = new Date(override.requestedCheckIn);
                    }
                    if (override.requestedCheckOut) {
                        lastPunchAt = new Date(override.requestedCheckOut);
                    }
                    if (firstPunchAt && lastPunchAt) {
                        workMinutes = Math.max(0, Math.floor((lastPunchAt.getTime() - firstPunchAt.getTime()) / 60000));
                    }
                }
                return {
                    employeeId: aggregate.employeeId,
                    date: aggregate.date,
                    shiftAssignmentSnapshotId: shift?.id ?? null,
                    result: this.policyEngine.evaluateDay({
                        workMinutes,
                        breakMinutes: aggregate.totalBreakMinutes,
                        firstPunchAt,
                        lastPunchAt,
                        approvedLeaveMinutes,
                        shift: {
                            startTime: shift?.startTime ?? '10:15',
                            endTime: shift?.endTime ?? '18:00',
                            gracePeriodMinutes: shift?.gracePeriodMinutes ?? 0,
                        },
                        policy,
                        device: { required: false, isTrusted: true },
                        geofence: { required: false },
                        isHoliday,
                        isWeeklyOff,
                    }),
                };
            });
            await this.eventPublisher.publish(tx, {
                eventType: events_1.DomainEventTypes.ATTENDANCE_FINALIZED,
                entityId: batch.id,
                entityType: 'AttendanceFinalizationBatch',
                companyId: input.companyId,
                payload: {
                    companyId: input.companyId,
                    attendancePeriodId: input.attendancePeriodId,
                    attendanceFinalizationBatchId: batch.id,
                    policyVersionId: policyVersion.id,
                    holidayCalendarVersionId: holidayVersion.id,
                    fullDayMinutes: policy.fullDayMinutes,
                    finalized,
                },
            });
            await tx.attendanceFinalizationBatch.update({
                where: { id: batch.id },
                data: {
                    status: client_1.BatchStatus.COMPLETED,
                    completedAt: new Date(),
                    processedCount: finalized.length,
                    failedCount: 0,
                },
            });
            await this.eventPublisher.publish(tx, {
                eventType: events_1.DomainEventTypes.ATTENDANCE_FINALIZATION_BATCH_COMPLETED,
                entityId: batch.id,
                entityType: 'AttendanceFinalizationBatch',
                companyId: input.companyId,
                payload: {
                    companyId: input.companyId,
                    attendancePeriodId: input.attendancePeriodId,
                    attendanceFinalizationBatchId: batch.id,
                    processedCount: finalized.length,
                },
            });
            await this.historyService.record({
                tx,
                companyId: input.companyId,
                targetType: 'AttendancePeriod',
                targetId: input.attendancePeriodId,
                actorId: input.finalizedById,
                transitionType: 'FINALIZATION_COMPLETED',
                previousState: 'UNDER_REVIEW',
                newState: 'CLOSED',
            });
            return {
                batchId: batch.id,
                processedCount: finalized.length,
                failedCount: 0,
            };
        });
    }
    async createPeriod(input) {
        const existing = await this.prisma.attendancePeriod.findUnique({
            where: {
                companyId_startDate_endDate: {
                    companyId: input.companyId,
                    startDate: input.startDate,
                    endDate: input.endDate,
                },
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('Attendance period already exists for these dates');
        }
        return this.prisma.$transaction(async (tx) => {
            const period = await tx.attendancePeriod.create({
                data: {
                    companyId: input.companyId,
                    startDate: input.startDate,
                    endDate: input.endDate,
                    status: 'OPEN',
                },
            });
            await this.historyService.record({
                tx,
                companyId: input.companyId,
                targetType: 'AttendancePeriod',
                targetId: period.id,
                actorId: input.createdById,
                transitionType: 'PERIOD_CREATED',
                newState: 'OPEN',
            });
            return period;
        });
    }
    async lockPeriod(companyId, periodId, lockedById) {
        const period = await this.prisma.attendancePeriod.findFirst({
            where: { id: periodId, companyId },
        });
        if (!period) {
            throw new common_1.NotFoundException('Attendance period not found');
        }
        if (period.status === 'PAYROLL_LOCKED') {
            throw new common_1.BadRequestException('Period is already payroll locked');
        }
        this.transitionService.validate('AttendancePeriod', period.status, 'PAYROLL_LOCKED');
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.attendancePeriod.update({
                where: { id: periodId },
                data: { status: 'PAYROLL_LOCKED' },
            });
            await this.historyService.record({
                tx,
                companyId,
                targetType: 'AttendancePeriod',
                targetId: periodId,
                actorId: lockedById,
                transitionType: 'PERIOD_LOCKED',
                previousState: period.status,
                newState: 'PAYROLL_LOCKED',
            });
            await this.eventPublisher.publish(tx, {
                eventType: events_1.DomainEventTypes.ATTENDANCE_PERIOD_LOCKED,
                entityId: periodId,
                entityType: 'AttendancePeriod',
                companyId,
                payload: {
                    companyId,
                    attendancePeriodId: periodId,
                    lockedById,
                },
            });
            return updated;
        });
    }
    parsePolicy(value) {
        const config = value ?? {};
        const fullDayMinutes = Number(config.fullDayMinutes);
        if (!fullDayMinutes || fullDayMinutes <= 0) {
            throw new common_1.BadRequestException('Attendance policy configuration is invalid: fullDayMinutes is required and must be a positive number');
        }
        const overtimeAfterMinutes = Number(config.overtimeAfterMinutes);
        if (!overtimeAfterMinutes || overtimeAfterMinutes <= 0) {
            throw new common_1.BadRequestException('Attendance policy configuration is invalid: overtimeAfterMinutes is required and must be a positive number');
        }
        return {
            halfDayThresholdMinutes: Number(config.halfDayThresholdMinutes) || 300,
            fullDayMinutes,
            overtimeAfterMinutes,
            lateAfterMinutes: Number(config.lateAfterMinutes) || 0,
        };
    }
    parseHolidayDates(calendarData) {
        const data = calendarData ?? {};
        const holidays = data.holidays ?? [];
        return new Set(holidays.map((h) => {
            const d = new Date(h.date);
            return d.toISOString().slice(0, 10);
        }));
    }
    parseWeeklyOffDays(policyConfiguration) {
        const config = policyConfiguration ?? {};
        const days = config.weeklyOffDays ?? [];
        return new Set(days);
    }
    async finalizePreviousDay(companyId) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setUTCHours(0, 0, 0, 0);
        const systemUser = await this.prisma.user.findFirst({
            where: {
                companyId,
                role: 'OWNER',
                isActive: true,
                deletedAt: null,
            },
        });
        if (!systemUser) {
            throw new common_1.BadRequestException(`No valid OWNER found for company ${companyId} to finalize attendance`);
        }
        let period = await this.prisma.attendancePeriod.findFirst({
            where: {
                companyId,
                startDate: { lte: yesterday },
                endDate: { gte: yesterday },
            },
        });
        if (!period) {
            period = await this.prisma.attendancePeriod.create({
                data: {
                    companyId,
                    startDate: yesterday,
                    endDate: yesterday,
                    status: 'OPEN',
                },
            });
        }
        if (period.status !== 'OPEN') {
            return;
        }
        return this.finalizePeriod({
            companyId,
            attendancePeriodId: period.id,
            finalizedById: systemUser.id,
        });
    }
};
exports.AttendanceFinalizationService = AttendanceFinalizationService;
exports.AttendanceFinalizationService = AttendanceFinalizationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        governance_event_publisher_1.GovernanceEventPublisher,
        attendance_policy_engine_1.AttendancePolicyEngine,
        attendance_history_service_1.AttendanceHistoryService,
        transition_service_1.TransitionService])
], AttendanceFinalizationService);
//# sourceMappingURL=attendance-finalization.service.js.map