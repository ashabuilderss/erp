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
exports.PerformanceService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../config/prisma.service");
const governance_event_publisher_1 = require("../governance-events/governance-event.publisher");
const events_1 = require("../governance-events/types/events");
const performance_engine_1 = require("./performance.engine");
let PerformanceService = class PerformanceService {
    prisma;
    eventPublisher;
    engine;
    constructor(prisma, eventPublisher, engine) {
        this.prisma = prisma;
        this.eventPublisher = eventPublisher;
        this.engine = engine;
    }
    async calculateScore(input) {
        const { companyId, employeeId, period, periodType, calculatedById } = input;
        const taskScore = await this.computeTaskScore(companyId, employeeId, period, periodType);
        const attendanceScore = await this.computeAttendanceScore(companyId, employeeId, period, periodType);
        const eodScore = await this.computeEodScore(companyId, employeeId, period, periodType);
        const previousScore = await this.getPreviousCompositeScore(companyId, employeeId, periodType);
        const managerScore = 0;
        const result = this.engine.calculate({
            taskScore,
            attendanceScore,
            eodScore,
            managerScore,
            previousCompositeScore: previousScore,
        });
        const scoreId = await this.prisma.$transaction(async (tx) => {
            const created = await tx.performanceScore.create({
                data: {
                    companyId,
                    employeeId,
                    period,
                    periodType,
                    taskScore: result.taskScore,
                    attendanceScore: result.attendanceScore,
                    eodScore: result.eodScore,
                    managerScore: result.managerScore,
                    compositeScore: result.compositeScore,
                    trend: result.trend,
                    calculatedById: calculatedById ?? null,
                },
            });
            await this.eventPublisher.publish(tx, {
                eventType: events_1.DomainEventTypes.PERFORMANCE_SCORE_CALCULATED,
                entityId: created.id,
                entityType: 'PerformanceScore',
                companyId,
                payload: {
                    companyId,
                    employeeId,
                    period,
                    periodType,
                    taskScore: result.taskScore,
                    attendanceScore: result.attendanceScore,
                    eodScore: result.eodScore,
                    managerScore: result.managerScore,
                    compositeScore: result.compositeScore,
                    trend: result.trend,
                    scoreDelta: result.scoreDelta,
                },
            });
            return created.id;
        });
        return scoreId;
    }
    async rateEmployee(input) {
        const { companyId, performanceScoreId, ratedById, score, comment } = input;
        if (score < 1 || score > 10) {
            throw new common_1.BadRequestException('Manager rating must be between 1 and 10');
        }
        const performanceScore = await this.prisma.performanceScore.findFirst({
            where: { id: performanceScoreId, companyId },
        });
        if (!performanceScore) {
            throw new common_1.NotFoundException(`Performance score with ID ${performanceScoreId} not found`);
        }
        const ratingId = await this.prisma.$transaction(async (tx) => {
            const rating = await tx.managerRating.create({
                data: {
                    companyId,
                    performanceScoreId,
                    ratedById,
                    score,
                    comment: comment ?? null,
                },
            });
            const allRatings = await tx.managerRating.findMany({
                where: { performanceScoreId },
            });
            const avgManagerScore = allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length;
            const normalizedManagerScore = (avgManagerScore / 10) * 100;
            const previousScore = await this.getPreviousCompositeScore(companyId, performanceScore.employeeId, performanceScore.periodType);
            const engineResult = this.engine.calculate({
                taskScore: performanceScore.taskScore,
                attendanceScore: performanceScore.attendanceScore,
                eodScore: performanceScore.eodScore,
                managerScore: normalizedManagerScore,
                previousCompositeScore: previousScore,
            });
            await tx.performanceScore.create({
                data: {
                    companyId,
                    employeeId: performanceScore.employeeId,
                    period: performanceScore.period,
                    periodType: performanceScore.periodType,
                    taskScore: engineResult.taskScore,
                    attendanceScore: engineResult.attendanceScore,
                    eodScore: engineResult.eodScore,
                    managerScore: engineResult.managerScore,
                    compositeScore: engineResult.compositeScore,
                    trend: engineResult.trend,
                    calculatedById: ratedById,
                },
            });
            await this.eventPublisher.publish(tx, {
                eventType: events_1.DomainEventTypes.MANAGER_RATING_RECORDED,
                entityId: rating.id,
                entityType: 'ManagerRating',
                companyId,
                payload: {
                    companyId,
                    performanceScoreId,
                    ratedById,
                    score,
                    comment: comment ?? null,
                    newCompositeScore: engineResult.compositeScore,
                    newTrend: engineResult.trend,
                    newManagerScore: engineResult.managerScore,
                    taskScore: engineResult.taskScore,
                    attendanceScore: engineResult.attendanceScore,
                    eodScore: engineResult.eodScore,
                },
            });
            return rating.id;
        });
        return ratingId;
    }
    async getScore(id, companyId) {
        const score = await this.prisma.performanceScore.findFirst({
            where: { id, companyId },
            include: {
                employees: { include: { users: true, departments: true } },
                managerRatings: {
                    include: { employees: { include: { users: true } } },
                },
            },
        });
        if (!score)
            throw new common_1.NotFoundException(`Performance score with ID ${id} not found`);
        return score;
    }
    async getCurrentScore(companyId, employeeId, period, periodType) {
        const score = await this.prisma.performanceScore.findFirst({
            where: { companyId, employeeId, period, periodType },
            orderBy: { calculatedAt: 'desc' },
            include: {
                employees: { include: { users: true, departments: true } },
                managerRatings: {
                    include: { employees: { include: { users: true } } },
                },
            },
        });
        return score;
    }
    async getEmployeeScores(companyId, employeeId, periodType) {
        const where = { companyId, employeeId };
        if (periodType)
            where.periodType = periodType;
        return this.prisma.performanceScore.findMany({
            where,
            orderBy: { calculatedAt: 'desc' },
            include: { managerRatings: true },
        });
    }
    async getHistoricalScores(companyId, employeeId, period, periodType) {
        return this.prisma.performanceScore.findMany({
            where: { companyId, employeeId, period, periodType },
            orderBy: { calculatedAt: 'desc' },
            include: { managerRatings: true },
        });
    }
    async getTrends(input) {
        const { companyId, employeeId, periodType, limit = 12 } = input;
        const where = { companyId };
        if (employeeId)
            where.employeeId = employeeId;
        if (periodType)
            where.periodType = periodType;
        return this.prisma.performanceTrendSnapshot.findMany({
            where,
            orderBy: { period: 'desc' },
            take: limit,
        });
    }
    async getLeaderboard(input) {
        const { companyId, period, periodType, limit = 20 } = input;
        const latestScoresPerEmployee = await this.prisma.performanceScore.groupBy({
            by: ['employeeId'],
            where: { companyId, period, periodType },
            _max: { calculatedAt: true },
        });
        const latestScores = await Promise.all(latestScoresPerEmployee.map(async (group) => {
            return this.prisma.performanceScore.findFirst({
                where: {
                    companyId,
                    employeeId: group.employeeId,
                    period,
                    periodType,
                    calculatedAt: group._max.calculatedAt,
                },
                include: {
                    employees: {
                        include: { users: true, departments: true, designations: true },
                    },
                },
            });
        }));
        const sorted = latestScores
            .filter((s) => s !== null)
            .sort((a, b) => b.compositeScore - a.compositeScore)
            .slice(0, limit);
        return sorted.map((score, index) => ({
            rank: index + 1,
            employeeId: score.employeeId,
            employeeName: score.employees.users
                ? `${score.employees.users.firstName} ${score.employees.users.lastName}`
                : 'Unknown',
            department: score.employees.departments?.name ?? 'Unknown',
            designation: score.employees.designations?.name ?? 'Unknown',
            compositeScore: score.compositeScore,
            taskScore: score.taskScore,
            attendanceScore: score.attendanceScore,
            eodScore: score.eodScore,
            managerScore: score.managerScore,
            trend: score.trend,
        }));
    }
    async recalculateScore(companyId, employeeId, period, periodType, calculatedById) {
        return this.calculateScore({
            companyId,
            employeeId,
            period,
            periodType,
            calculatedById,
        });
    }
    async listScores(companyId, options) {
        const { page = 1, limit = 10, employeeId, periodType, period } = options;
        const where = { companyId };
        if (employeeId)
            where.employeeId = employeeId;
        if (periodType)
            where.periodType = periodType;
        if (period)
            where.period = period;
        const [data, total] = await Promise.all([
            this.prisma.performanceScore.findMany({
                where,
                orderBy: { calculatedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    employees: { include: { users: true, departments: true } },
                },
            }),
            this.prisma.performanceScore.count({ where }),
        ]);
        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async computeTaskScore(companyId, employeeId, period, periodType) {
        const periodRange = this.getPeriodRange(period, periodType);
        const tasks = await this.prisma.task.findMany({
            where: {
                companyId,
                assigneeId: employeeId,
                createdAt: { gte: periodRange.start, lt: periodRange.end },
            },
        });
        if (tasks.length === 0)
            return 50;
        const completedTasks = tasks.filter((t) => t.status === client_1.TaskStatus.COMPLETED);
        return Math.round((completedTasks.length / tasks.length) * 100);
    }
    async computeAttendanceScore(companyId, employeeId, period, periodType) {
        const periodRange = this.getPeriodRange(period, periodType);
        const summaries = await this.prisma.attendanceSummary.findMany({
            where: {
                companyId,
                employeeId,
                attendancePeriods: {
                    startDate: { gte: periodRange.start },
                    endDate: { lt: periodRange.end },
                },
            },
        });
        if (summaries.length === 0)
            return 50;
        const totalPayable = summaries.reduce((sum, s) => sum + s.payableMinutes, 0);
        const totalLate = summaries.reduce((sum, s) => sum + s.lateMinutes, 0);
        const totalAbsent = summaries.reduce((sum, s) => sum + s.absentDays, 0);
        const totalDays = summaries.length;
        if (totalDays === 0)
            return 50;
        const attendanceRate = ((totalDays - totalAbsent) / totalDays) * 100;
        const punctualityRate = totalPayable > 0
            ? ((totalPayable - totalLate) / totalPayable) * 100
            : 100;
        return Math.round(attendanceRate * 0.6 + punctualityRate * 0.4);
    }
    async computeEodScore(companyId, employeeId, period, periodType) {
        const periodRange = this.getPeriodRange(period, periodType);
        const eodReports = await this.prisma.eodReport.findMany({
            where: {
                companyId,
                employeeId,
                reportDate: { gte: periodRange.start, lt: periodRange.end },
            },
        });
        if (eodReports.length === 0)
            return 50;
        const totalDays = this.getWorkingDaysInRange(periodRange.start, periodRange.end);
        const submittedCount = eodReports.filter((r) => r.status === 'SUBMITTED' || r.status === 'REVIEWED').length;
        return Math.round((submittedCount / totalDays) * 100);
    }
    async getPreviousCompositeScore(companyId, employeeId, currentPeriodType) {
        const previous = await this.prisma.performanceScore.findFirst({
            where: {
                companyId,
                employeeId,
                periodType: currentPeriodType,
            },
            orderBy: { calculatedAt: 'desc' },
        });
        return previous?.compositeScore ?? null;
    }
    getPeriodRange(period, periodType) {
        const [yearStr, partStr] = period.split('-');
        const year = parseInt(yearStr, 10);
        switch (periodType) {
            case client_1.PerformancePeriod.WEEKLY: {
                const weekNum = parseInt(partStr, 10);
                const jan1 = new Date(Date.UTC(year, 0, 1));
                const dayOffset = (weekNum - 1) * 7;
                const start = new Date(jan1.getTime() + dayOffset * 86400000);
                const end = new Date(start.getTime() + 7 * 86400000);
                return { start, end };
            }
            case client_1.PerformancePeriod.MONTHLY: {
                const month = parseInt(partStr, 10) - 1;
                const start = new Date(Date.UTC(year, month, 1));
                const end = new Date(Date.UTC(year, month + 1, 1));
                return { start, end };
            }
            case client_1.PerformancePeriod.QUARTERLY: {
                const quarter = parseInt(partStr, 10);
                const startMonth = (quarter - 1) * 3;
                const start = new Date(Date.UTC(year, startMonth, 1));
                const end = new Date(Date.UTC(year, startMonth + 3, 1));
                return { start, end };
            }
            case client_1.PerformancePeriod.YEARLY: {
                const start = new Date(Date.UTC(year, 0, 1));
                const end = new Date(Date.UTC(year + 1, 0, 1));
                return { start, end };
            }
        }
    }
    getWorkingDaysInRange(start, end) {
        let count = 0;
        const current = new Date(start);
        while (current < end) {
            const day = current.getUTCDay();
            if (day !== 0 && day !== 6)
                count++;
            current.setUTCDate(current.getUTCDate() + 1);
        }
        return Math.max(1, count);
    }
};
exports.PerformanceService = PerformanceService;
exports.PerformanceService = PerformanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        governance_event_publisher_1.GovernanceEventPublisher,
        performance_engine_1.PerformanceEngine])
], PerformanceService);
//# sourceMappingURL=performance.service.js.map