import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { SiteVisitsService } from './site-visits.service';
import { CreateSiteVisitDto } from './dto/create-site-visit.dto';
import { UpdateSiteVisitDto } from './dto/update-site-visit.dto';
import { QuerySiteVisitDto } from './dto/query-site-visit.dto';
import { UpdateSiteVisitStatusDto } from './dto/update-site-visit-status.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  CurrentCompany,
  CurrentEmployeeId,
  CurrentUser,
} from '../../../common/decorators/current-user.decorator';
import { UserRole, SiteVisitStatus } from '@prisma/client';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { Permissions } from '../../../common/auth/permissions';
import { UseIdempotency } from '../../../common/decorators/idempotency.decorator';
import { getScopedEmployeeId } from '../../../common/utils/role-scope.util';

@Controller('site-visits')
export class SiteVisitsController {
  constructor(private readonly siteVisitsService: SiteVisitsService) {}

  @Post()
  @UseIdempotency()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.SITE_VISIT_CREATE)
  async create(
    @Body() dto: CreateSiteVisitDto,
    @CurrentCompany('id') companyId: string,
    @CurrentUser('role') role: string,
    @CurrentEmployeeId() employeeId: string | null,
  ) {
    return this.siteVisitsService.create(
      dto,
      companyId,
      role,
      employeeId ?? undefined,
    );
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.SITE_VISIT_READ)
  async findAll(
    @Query() query: QuerySiteVisitDto,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentUser('role') role: string,
  ) {
    return this.siteVisitsService.findAll(
      query,
      companyId,
      getScopedEmployeeId(role, employeeId),
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.SITE_VISIT_READ)
  async findOne(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentUser('role') role: string,
  ) {
    return this.siteVisitsService.findOne(
      id,
      companyId,
      getScopedEmployeeId(role, employeeId),
    );
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.SITE_VISIT_UPDATE)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSiteVisitDto,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentUser('role') role: string,
  ) {
    return this.siteVisitsService.update(
      id,
      dto,
      companyId,
      getScopedEmployeeId(role, employeeId),
      role,
      employeeId ?? undefined,
    );
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.SITE_VISIT_UPDATE)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSiteVisitStatusDto,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentUser('role') role: string,
  ) {
    return this.siteVisitsService.updateStatus(
      id,
      dto.status,
      companyId,
      getScopedEmployeeId(role, employeeId),
      role,
      employeeId ?? undefined,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @RequirePermissions(Permissions.SITE_VISIT_DELETE)
  async remove(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.siteVisitsService.remove(id, companyId);
  }
}
