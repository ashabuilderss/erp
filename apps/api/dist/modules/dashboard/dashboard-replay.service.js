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
var DashboardReplayService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardReplayService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
let DashboardReplayService = DashboardReplayService_1 = class DashboardReplayService {
    prisma;
    logger = new common_1.Logger(DashboardReplayService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async rebuildSnapshot(companyId, dateStr) {
        const targetDate = dateStr ? new Date(dateStr) : new Date();
        targetDate.setUTCHours(0, 0, 0, 0);
        this.logger.log(`Rebuilding dashboard snapshot for company ${companyId} on ${targetDate.toISOString()}`);
        const totalEmployees = await this.prisma.employee.count({
            where: { companyId, status: 'ACTIVE' },
        });
        const pendingApprovals = await this.prisma.approvalRequest.count({
            where: { companyId, status: 'PENDING' },
        });
        const overdueTasks = await this.prisma.task.count({
            where: {
                companyId,
                status: { notIn: ['COMPLETED', 'OVERDUE'] },
                dueDate: { lt: targetDate },
            },
        });
        const activeWarnings = await this.prisma.warning.count({
            where: { companyId, status: 'PENDING' },
        });
        const activePayrollHolds = await this.prisma.payrollHold.count({
            where: { companyId, status: 'ACTIVE_HOLD' },
        });
        const onLeaveToday = await this.prisma.leaveRequest.count({
            where: {
                companyId,
                status: 'APPROVED',
                startDate: { lte: targetDate },
                endDate: { gte: targetDate },
            },
        });
        const totalProperties = await this.prisma.property.count({
            where: { companyId },
        });
        const totalLeads = await this.prisma.lead.count({ where: { companyId } });
        const convertedLeads = await this.prisma.lead.count({
            where: { companyId, status: 'CONVERTED' },
        });
        const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
        const totalSiteVisits = await this.prisma.siteVisit.count({
            where: { companyId },
        });
        const totalBookings = await this.prisma.booking.count({
            where: { companyId },
        });
        const bookingAgg = await this.prisma.booking.aggregate({
            where: { companyId, status: 'CONFIRMED' },
            _sum: { amount: true },
        });
        const totalRevenue = Number(bookingAgg._sum?.amount ?? 0);
        const criticalAlerts = await this.prisma.dashboardAlert.count({
            where: { companyId, severity: 'CRITICAL', status: 'ACTIVE' },
        });
        const avgResult = await this.prisma.performanceScore.aggregate({
            where: { companyId },
            _avg: { compositeScore: true },
        });
        const avgPerformanceScore = avgResult._avg?.compositeScore ?? 0;
        const snapshot = await this.prisma.dashboardKpiSnapshot.upsert({
            where: {
                companyId_snapshotDate: {
                    companyId,
                    snapshotDate: targetDate,
                },
            },
            create: {
                companyId,
                snapshotDate: targetDate,
                totalEmployees,
                presentEmployees: 0,
                absentEmployees: 0,
                lateEmployees: 0,
                onLeaveToday,
                overdueTasks,
                activeWarnings,
                activePayrollHolds,
                pendingApprovals,
                collectionStatus: 0,
                siteDelays: 0,
                materialAlerts: 0,
                criticalAlerts,
                avgPerformanceScore,
                totalProperties,
                totalLeads,
                newLeads: 0,
                convertedLeads,
                conversionRate,
                totalSiteVisits,
                totalBookings,
                totalRevenue,
                rebuiltAt: new Date(),
                lastProjectionUpdate: new Date(),
            },
            update: {
                totalEmployees,
                onLeaveToday,
                overdueTasks,
                activeWarnings,
                activePayrollHolds,
                pendingApprovals,
                criticalAlerts,
                avgPerformanceScore,
                totalProperties,
                totalLeads,
                convertedLeads,
                conversionRate,
                totalSiteVisits,
                totalBookings,
                totalRevenue,
                rebuiltAt: new Date(),
                lastProjectionUpdate: new Date(),
            },
        });
        this.logger.log(`Snapshot rebuilt for company ${companyId}`);
        return snapshot;
    }
};
exports.DashboardReplayService = DashboardReplayService;
exports.DashboardReplayService = DashboardReplayService = DashboardReplayService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardReplayService);
//# sourceMappingURL=dashboard-replay.service.js.map