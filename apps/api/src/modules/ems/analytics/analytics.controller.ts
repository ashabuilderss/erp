import {
  Controller,
  Get,
  Param,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { Permissions } from '../../../common/auth/permissions';
import {
  CurrentCompany,
  CurrentEmployeeId,
  CurrentUser,
} from '../../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.EMS_READ)
  async getDashboardStats(@CurrentCompany('id') companyId: string) {
    return this.analyticsService.getDashboardStats(companyId);
  }

  @Get('employee/:employeeId')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.EMS_READ)
  async getEmployeeAnalytics(
    @Param('employeeId') employeeId: string,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() currentEmployeeId: string | null,
    @CurrentUser('role') role: string,
  ) {
    if (role === UserRole.EMPLOYEE && employeeId !== currentEmployeeId) {
      throw new ForbiddenException(
        'Employees can only view their own analytics',
      );
    }
    return this.analyticsService.getEmployeeAnalytics(
      role === UserRole.EMPLOYEE ? currentEmployeeId! : employeeId,
      companyId,
    );
  }

  @Get('my')
  @Roles(UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.EMS_READ)
  async getMyAnalytics(
    @CurrentEmployeeId() employeeId: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.analyticsService.getEmployeeAnalytics(employeeId, companyId);
  }

  @Get('team')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.EMS_READ)
  async getTeamAnalytics(
    @CurrentCompany('id') companyId: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.analyticsService.getTeamAnalytics(companyId, departmentId);
  }

  @Get('conversion-funnel')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.EMS_READ)
  async getConversionFunnel(@CurrentCompany('id') companyId: string) {
    return this.analyticsService.getConversionFunnel(companyId);
  }

  @Get('bookings-by-employee')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.EMS_READ)
  async getBookingsByEmployee(@CurrentCompany('id') companyId: string) {
    return this.analyticsService.getBookingsByEmployee(companyId);
  }

  @Get('site-visits-by-employee')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.EMS_READ)
  async getSiteVisitsByEmployee(@CurrentCompany('id') companyId: string) {
    return this.analyticsService.getSiteVisitsByEmployee(companyId);
  }
}
