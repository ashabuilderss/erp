import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { OwnerDashboardService } from './owner-dashboard.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentCompany } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permissions } from '../../common/auth/permissions';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly legacyService: DashboardService,
    private readonly ownerDashboardService: OwnerDashboardService,
  ) {}

  @Get('owner/metrics')
  @Roles(UserRole.OWNER)
  @RequirePermissions(Permissions.DASHBOARD_VIEW)
  async getOwnerMetrics(
    @CurrentCompany('id') companyId: string,
    @Query('date') dateStr?: string,
  ) {
    return this.legacyService.getMetricsSnapshot(companyId, dateStr);
  }

  @Get('owner/kpi')
  @Roles(UserRole.OWNER)
  @RequirePermissions(Permissions.DASHBOARD_VIEW)
  async getOwnerKpi(
    @CurrentCompany('id') companyId: string,
    @Query('date') dateStr?: string,
  ) {
    return this.ownerDashboardService.getKpiSnapshot(companyId, dateStr);
  }

  @Get('owner/alerts')
  @Roles(UserRole.OWNER)
  @RequirePermissions(Permissions.DASHBOARD_VIEW)
  async getOwnerAlerts(
    @CurrentCompany('id') companyId: string,
    @Query('limit') limitStr?: string,
  ) {
    const limit = limitStr ? parseInt(limitStr, 10) : 20;
    return this.ownerDashboardService.getRecentAlerts(companyId, limit);
  }

  @Get('owner/history')
  @Roles(UserRole.OWNER)
  @RequirePermissions(Permissions.DASHBOARD_VIEW)
  async getOwnerHistory(
    @CurrentCompany('id') companyId: string,
    @Query('days') daysStr?: string,
  ) {
    const days = daysStr ? parseInt(daysStr, 10) : 30;
    return this.ownerDashboardService.getSnapshotHistory(companyId, days);
  }
}
