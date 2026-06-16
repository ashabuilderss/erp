import { Controller, Get, Param, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  CurrentCompany,
  CurrentEmployeeId,
} from '../../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async getDashboardStats(@CurrentCompany('id') companyId: string) {
    return this.analyticsService.getDashboardStats(companyId);
  }

  @Get('employee/:employeeId')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  async getEmployeeAnalytics(
    @Param('employeeId') employeeId: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.analyticsService.getEmployeeAnalytics(employeeId, companyId);
  }

  @Get('my')
  @Roles(UserRole.EMPLOYEE)
  async getMyAnalytics(
    @CurrentEmployeeId() employeeId: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.analyticsService.getEmployeeAnalytics(employeeId, companyId);
  }

  @Get('team')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async getTeamAnalytics(
    @CurrentCompany('id') companyId: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.analyticsService.getTeamAnalytics(companyId, departmentId);
  }

  @Get('conversion-funnel')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async getConversionFunnel(@CurrentCompany('id') companyId: string) {
    return this.analyticsService.getConversionFunnel(companyId);
  }
}
