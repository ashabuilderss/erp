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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
let DashboardService = class DashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMetricsSnapshot(companyId, dateStr) {
        const targetDate = dateStr ? new Date(dateStr) : new Date();
        targetDate.setUTCHours(0, 0, 0, 0);
        const snapshot = await this.prisma.dashboardMetricsSnapshot.findUnique({
            where: {
                companyId_snapshotDate: {
                    companyId,
                    snapshotDate: targetDate,
                },
            },
        });
        if (!snapshot) {
            return {
                companyId,
                snapshotDate: targetDate,
                totalEmployees: 0,
                presentEmployees: 0,
                absentEmployees: 0,
                lateEmployees: 0,
                pendingApprovals: 0,
                overdueTasks: 0,
                activeWarnings: 0,
                activePayrollHolds: 0,
            };
        }
        return snapshot;
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map