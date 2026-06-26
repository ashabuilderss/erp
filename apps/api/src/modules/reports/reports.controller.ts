import { Controller, Get, Post, Body, Query, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { CreateReportExportDto, QueryReportExportDto, QueryAnalyticsDto } from './dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentCompany, CurrentUser, CurrentEmployeeId } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { Permissions } from '../../common/auth/permissions';

@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('catalog')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.REPORT_VIEW)
  async getCatalog() {
    return this.service.getCatalog();
  }

  // ─── Analytics: KPI Dashboard ───────────────────────────────────────

  @Get('kpi-dashboard')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.ANALYTICS_VIEW)
  async getKPIDashboard(
    @Query() dto: QueryAnalyticsDto,
    @CurrentCompany('id') companyId: string,
    @CurrentUser('role') userRole: string,
    @CurrentEmployeeId() employeeId: string | null,
  ) {
    return this.service.getKPIDashboard({ userRole, employeeId, companyId }, dto);
  }

  // ─── Analytics: Pipeline Funnel ─────────────────────────────────────

  @Get('pipeline-funnel')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.ANALYTICS_VIEW)
  async getPipelineFunnel(
    @Query() dto: QueryAnalyticsDto,
    @CurrentCompany('id') companyId: string,
    @CurrentUser('role') userRole: string,
    @CurrentEmployeeId() employeeId: string | null,
  ) {
    return this.service.getPipelineFunnel({ userRole, employeeId, companyId }, dto);
  }

  // ─── Analytics: Trends ──────────────────────────────────────────────

  @Get('trends')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.ANALYTICS_VIEW)
  async getTrends(
    @Query() dto: QueryAnalyticsDto,
    @CurrentCompany('id') companyId: string,
    @CurrentUser('role') userRole: string,
    @CurrentEmployeeId() employeeId: string | null,
  ) {
    return this.service.getTrends({ userRole, employeeId, companyId }, dto);
  }

  // ─── Analytics: Leaderboard (fixed duplicates) ──────────────────────

  @Get('leaderboard')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.ANALYTICS_VIEW)
  async getLeaderboard(
    @CurrentCompany('id') companyId: string,
    @CurrentUser('role') userRole: string,
    @CurrentEmployeeId() employeeId: string | null,
  ) {
    return this.service.getLeaderboard({ userRole, employeeId, companyId });
  }

  // ─── Report Exports ─────────────────────────────────────────────────

  @Get('exports')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.REPORT_VIEW, Permissions.REPORT_EXPORT)
  async getExports(
    @Query() query: QueryReportExportDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.getExports(companyId, query.page, query.limit);
  }

  @Post('exports')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.REPORT_EXPORT)
  async createExport(
    @Body() dto: CreateReportExportDto,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() generatedById: string | null,
  ) {
    return this.service.createExport(dto, companyId, generatedById);
  }
}
