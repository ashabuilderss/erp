import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getMetricsSnapshot(companyId: string, dateStr?: string) {
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
}
