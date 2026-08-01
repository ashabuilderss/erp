import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class OwnerDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getKpiSnapshot(companyId: string, dateStr?: string) {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    targetDate.setUTCHours(0, 0, 0, 0);

    const snapshot = await (this.prisma as any).dashboardKpiSnapshot.findUnique(
      {
        where: {
          companyId_snapshotDate: {
            companyId,
            snapshotDate: targetDate,
          },
        },
      },
    );

    if (!snapshot) {
      return this.getEmptySnapshot(companyId, targetDate);
    }

    return snapshot;
  }

  async getRecentAlerts(companyId: string, limit = 20) {
    return (this.prisma as any).dashboardAlert.findMany({
      where: { companyId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getSnapshotHistory(companyId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setUTCHours(0, 0, 0, 0);

    return (this.prisma as any).dashboardKpiSnapshot.findMany({
      where: {
        companyId,
        snapshotDate: { gte: since },
      },
      orderBy: { snapshotDate: 'desc' },
    });
  }

  private getEmptySnapshot(companyId: string, snapshotDate: Date) {
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
}
