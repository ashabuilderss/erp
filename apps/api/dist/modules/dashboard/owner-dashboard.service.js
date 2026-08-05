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
exports.OwnerDashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
let OwnerDashboardService = class OwnerDashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getKpiSnapshot(companyId, dateStr) {
        const targetDate = dateStr ? new Date(dateStr) : new Date();
        targetDate.setUTCHours(0, 0, 0, 0);
        const snapshot = await this.prisma.dashboardKpiSnapshot.findUnique({
            where: {
                companyId_snapshotDate: {
                    companyId,
                    snapshotDate: targetDate,
                },
            },
        });
        if (!snapshot) {
            return this.getEmptySnapshot(companyId, targetDate);
        }
        return snapshot;
    }
    async getRecentAlerts(companyId, limit = 20) {
        return this.prisma.dashboardAlert.findMany({
            where: { companyId, status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async getSnapshotHistory(companyId, days = 30) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        since.setUTCHours(0, 0, 0, 0);
        return this.prisma.dashboardKpiSnapshot.findMany({
            where: {
                companyId,
                snapshotDate: { gte: since },
            },
            orderBy: { snapshotDate: 'desc' },
        });
    }
    getEmptySnapshot(companyId, snapshotDate) {
        return {
            id: null,
            companyId,
            snapshotDate,
            totalEmployees: 0,
            presentEmployees: 0,
            absentEmployees: 0,
            lateEmployees: 0,
            onLeaveToday: 0,
            overdueTasks: 0,
            activeWarnings: 0,
            activePayrollHolds: 0,
            pendingApprovals: 0,
            collectionStatus: 0,
            siteDelays: 0,
            materialAlerts: 0,
            criticalAlerts: 0,
            avgPerformanceScore: 0,
            topPerformers: [],
            totalProperties: 0,
            totalLeads: 0,
            newLeads: 0,
            convertedLeads: 0,
            conversionRate: 0,
            totalSiteVisits: 0,
            totalBookings: 0,
            totalRevenue: 0,
            projectionVersion: 0,
            lastProcessedEventId: null,
            lastProcessedCorrelationId: null,
            rebuiltAt: null,
            lastProjectionUpdate: null,
        };
    }
};
exports.OwnerDashboardService = OwnerDashboardService;
exports.OwnerDashboardService = OwnerDashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OwnerDashboardService);
//# sourceMappingURL=owner-dashboard.service.js.map