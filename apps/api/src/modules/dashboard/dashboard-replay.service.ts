import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class DashboardReplayService {
  private readonly logger = new Logger(DashboardReplayService.name);

  constructor(private readonly prisma: PrismaService) {}

  async rebuildSnapshot(companyId: string, dateStr?: string) {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    targetDate.setUTCHours(0, 0, 0, 0);

    this.logger.log(
      `Rebuilding dashboard snapshot for company ${companyId} on ${targetDate.toISOString()}`,
    );

    const totalEmployees = await this.prisma.employee.count({
      where: { companyId, status: 'ACTIVE' },
    });

    const pendingApprovals = await (this.prisma as any).approvalRequest.count({
      where: { companyId, status: 'PENDING' },
    });

    const overdueTasks = await (this.prisma as any).task.count({
      where: {
        companyId,
        status: { notIn: ['COMPLETED', 'OVERDUE'] },
        dueDate: { lt: targetDate },
      },
    });

    const activeWarnings = await this.prisma.warning.count({
      where: { companyId, status: 'PENDING' },
    });

    const activePayrollHolds = await (this.prisma as any).payrollHold.count({
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
    const conversionRate =
      totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
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

    const criticalAlerts = await (this.prisma as any).dashboardAlert.count({
      where: { companyId, severity: 'CRITICAL', status: 'ACTIVE' },
    });

    const avgResult = await (this.prisma as any).performanceScore.aggregate({
      where: { companyId },
      _avg: { compositeScore: true },
    });
    const avgPerformanceScore = avgResult._avg?.compositeScore ?? 0;

    const snapshot = await (this.prisma as any).dashboardKpiSnapshot.upsert({
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
}
