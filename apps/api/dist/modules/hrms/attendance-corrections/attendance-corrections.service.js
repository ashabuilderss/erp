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
exports.AttendanceCorrectionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../config/prisma.service");
const approvals_1 = require("../../approvals");
const attendance_finalization_service_1 = require("../attendance/attendance-finalization.service");
const employees_service_1 = require("../employees/employees.service");
const governance_event_publisher_1 = require("../../governance-events/governance-event.publisher");
const events_1 = require("../../governance-events/types/events");
const attendance_history_service_1 = require("../attendance/attendance-history.service");
let AttendanceCorrectionsService = class AttendanceCorrectionsService {
    prisma;
    approvalsSpawning;
    approvalsRuntime;
    finalizationService;
    employeesService;
    eventPublisher;
    historyService;
    constructor(prisma, approvalsSpawning, approvalsRuntime, finalizationService, employeesService, eventPublisher, historyService) {
        this.prisma = prisma;
        this.approvalsSpawning = approvalsSpawning;
        this.approvalsRuntime = approvalsRuntime;
        this.finalizationService = finalizationService;
        this.employeesService = employeesService;
        this.eventPublisher = eventPublisher;
        this.historyService = historyService;
    }
    async create(dto, employeeId, companyId) {
        const correctionDate = new Date(dto.date);
        correctionDate.setUTCHours(0, 0, 0, 0);
        const employee = await this.employeesService.findBasicByIdAndCompany(employeeId, companyId);
        if (!employee?.userId) {
            throw new common_1.BadRequestException('Employee user account is required for correction approval');
        }
        const employeeUserId = employee.userId;
        const dayAggregate = await this.prisma.attendanceDayAggregate.findFirst({
            where: { employeeId, companyId, date: correctionDate },
        });
        const result = await this.prisma.$transaction(async (tx) => {
            const correction = await tx.attendanceCorrection.create({
                data: {
                    employeeId,
                    companyId,
                    reason: dto.reason,
                    dayAggregateId: dayAggregate?.id,
                    requestedCheckIn: dto.requestedCheckIn,
                    requestedCheckOut: dto.requestedCheckOut,
                    requestedStatus: dto.requestedStatus,
                },
            });
            const approval = await this.approvalsSpawning.spawnRequest(companyId, 'AttendanceCorrection', correction.id, employeeUserId);
            const updated = await tx.attendanceCorrection.update({
                where: { id: correction.id },
                data: { approvalRequestId: approval.id },
            });
            await this.historyService.record({
                tx,
                companyId,
                targetType: 'AttendanceCorrection',
                targetId: correction.id,
                actorId: employeeId,
                transitionType: 'CORRECTION_REQUESTED',
                newState: 'PENDING',
                reason: dto.reason,
            });
            await this.eventPublisher.publish(tx, {
                eventType: events_1.DomainEventTypes.ATTENDANCE_CORRECTION_REQUESTED,
                entityId: correction.id,
                entityType: 'AttendanceCorrection',
                companyId,
                payload: {
                    companyId,
                    correctionId: correction.id,
                    employeeId,
                },
            });
            return updated;
        });
        return result;
    }
    async findAll(query, companyId) {
        const where = { companyId };
        if (query.employeeId)
            where.employeeId = query.employeeId;
        const [data, total] = await Promise.all([
            this.prisma.attendanceCorrection.findMany({
                where,
                skip: ((query.page ?? 1) - 1) * (query.limit ?? 10),
                take: query.limit ?? 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    approvalRequests: {
                        select: {
                            status: true,
                            approvalHistories: { select: { comments: true }, orderBy: { createdAt: 'desc' }, take: 1 },
                        },
                    },
                    employees: { include: { users: true } },
                },
            }),
            this.prisma.attendanceCorrection.count({ where }),
        ]);
        let filtered = data.map((c) => ({
            ...c,
            status: c.approvalRequests?.status ?? 'PENDING',
            notes: c.approvalRequests?.approvalHistories?.[0]?.comments ?? null,
            employee: c.employees,
        }));
        if (query.status) {
            filtered = filtered.filter((c) => c.status === query.status);
        }
        return {
            data: filtered,
            meta: {
                total,
                page: query.page ?? 1,
                limit: query.limit ?? 10,
                totalPages: Math.ceil(total / (query.limit ?? 10)),
            },
        };
    }
    async findMyCorrections(employeeId) {
        const corrections = await this.prisma.attendanceCorrection.findMany({
            where: { employeeId },
            orderBy: { createdAt: 'desc' },
            include: {
                approvalRequests: {
                    select: {
                        status: true,
                        approvalHistories: { select: { comments: true }, orderBy: { createdAt: 'desc' }, take: 1 },
                    },
                },
            },
        });
        return corrections.map((c) => ({
            ...c,
            status: c.approvalRequests?.status ?? 'PENDING',
            notes: c.approvalRequests?.approvalHistories?.[0]?.comments ?? null,
        }));
    }
    async findOne(id, companyId) {
        const correction = await this.prisma.attendanceCorrection.findFirst({
            where: { id, companyId },
            include: {
                employees: true,
                attendanceDayAggregates: true,
                attendanceEvidence: true,
            },
        });
        if (!correction) {
            throw new common_1.NotFoundException('Attendance correction not found');
        }
        return correction;
    }
    async approve(id, approvedById, companyId, notes) {
        const correction = await this.findOne(id, companyId);
        if (!correction.approvalRequestId) {
            throw new common_1.BadRequestException('Attendance correction has no approval request');
        }
        await this.approvalsRuntime.approveStep(correction.approvalRequestId, approvedById, notes);
        const approval = await this.prisma.approvalRequest.findFirst({
            where: { id: correction.approvalRequestId, companyId },
        });
        if (approval?.status === 'APPROVED') {
            await this.prisma.$transaction(async (tx) => {
                await this.historyService.record({
                    tx,
                    companyId,
                    targetType: 'AttendanceCorrection',
                    targetId: id,
                    actorId: approvedById,
                    transitionType: 'CORRECTION_APPROVED',
                    previousState: 'PENDING',
                    newState: 'APPROVED',
                });
                await this.eventPublisher.publish(tx, {
                    eventType: events_1.DomainEventTypes.ATTENDANCE_CORRECTION_APPROVED,
                    entityId: id,
                    entityType: 'AttendanceCorrection',
                    companyId,
                    payload: {
                        companyId,
                        correctionId: id,
                        employeeId: correction.employeeId,
                        approvedById,
                    },
                });
            });
            if (correction.attendanceDayAggregates) {
                await this.refinalizeCorrectionDay(companyId, approvedById, correction.attendanceDayAggregates.date, correction.id);
            }
        }
        return this.findOne(id, companyId);
    }
    async reject(id, approvedById, companyId, notes) {
        const correction = await this.findOne(id, companyId);
        if (!correction.approvalRequestId) {
            throw new common_1.BadRequestException('Attendance correction has no approval request');
        }
        await this.approvalsRuntime.rejectStep(correction.approvalRequestId, approvedById, notes);
        await this.prisma.$transaction(async (tx) => {
            await this.historyService.record({
                tx,
                companyId,
                targetType: 'AttendanceCorrection',
                targetId: id,
                actorId: approvedById,
                transitionType: 'CORRECTION_REJECTED',
                previousState: 'PENDING',
                newState: 'REJECTED',
                reason: notes,
            });
            await this.eventPublisher.publish(tx, {
                eventType: events_1.DomainEventTypes.ATTENDANCE_CORRECTION_REJECTED,
                entityId: id,
                entityType: 'AttendanceCorrection',
                companyId,
                payload: {
                    companyId,
                    correctionId: id,
                    employeeId: correction.employeeId,
                    rejectedById: approvedById,
                },
            });
        });
        return this.findOne(id, companyId);
    }
    async refinalizeCorrectionDay(companyId, finalizedById, date, correctionId) {
        const period = await this.prisma.attendancePeriod.findFirst({
            where: {
                companyId,
                startDate: { lte: date },
                endDate: { gte: date },
                status: { not: 'PAYROLL_LOCKED' },
            },
        });
        if (!period)
            return;
        const correction = await this.prisma.attendanceCorrection.findFirst({
            where: { id: correctionId },
        });
        const correctionOverrides = correction?.dayAggregateId
            ? [
                {
                    dayAggregateId: correction.dayAggregateId,
                    requestedCheckIn: correction.requestedCheckIn ?? undefined,
                    requestedCheckOut: correction.requestedCheckOut ?? undefined,
                },
            ]
            : [];
        await this.finalizationService.finalizePeriod({
            companyId,
            attendancePeriodId: period.id,
            finalizedById,
            correctionOverrides,
        });
    }
};
exports.AttendanceCorrectionsService = AttendanceCorrectionsService;
exports.AttendanceCorrectionsService = AttendanceCorrectionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        approvals_1.ApprovalsSpawningService,
        approvals_1.ApprovalsRuntimeService,
        attendance_finalization_service_1.AttendanceFinalizationService,
        employees_service_1.EmployeesService,
        governance_event_publisher_1.GovernanceEventPublisher,
        attendance_history_service_1.AttendanceHistoryService])
], AttendanceCorrectionsService);
//# sourceMappingURL=attendance-corrections.service.js.map