import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { EodReportsService } from './eod-reports.service';
import {
  CreateEodReportDto,
  UpdateEodReportDto,
} from './dto/create-eod-report.dto';
import { QueryEodReportDto } from './dto/query-eod-report.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permissions } from '../../common/auth/permissions';
import {
  CurrentCompany,
  CurrentEmployeeId,
} from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { UseIdempotency } from '../../common/decorators/idempotency.decorator';

@Controller('eod-reports')
export class EodReportsController {
  constructor(private readonly service: EodReportsService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER, UserRole.TEAM_LEAD)
  @RequirePermissions(Permissions.EOD_READ)
  async findAll(
    @Query() query: QueryEodReportDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findAll(companyId, query.date, query.employeeId);
  }

  @Get('my')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.TEAM_LEAD, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.EOD_READ)
  async findMy(
    @Query() query: QueryEodReportDto,
    @CurrentEmployeeId() employeeId: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findByEmployee(employeeId, companyId, query.date);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER, UserRole.TEAM_LEAD)
  @RequirePermissions(Permissions.EOD_READ)
  async findOne(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findOne(id, companyId);
  }

  @Post()
  @UseIdempotency()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.TEAM_LEAD, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.EOD_CREATE)
  async create(
    @Body() dto: CreateEodReportDto,
    @CurrentEmployeeId() employeeId: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.create(dto, employeeId, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  @RequirePermissions(Permissions.EOD_REVIEW)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEodReportDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.update(id, dto, companyId);
  }

  @Patch(':id/review')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  @RequirePermissions(Permissions.EOD_REVIEW)
  async review(
    @Param('id') id: string,
    @Body() dto: UpdateEodReportDto,
    @CurrentEmployeeId() currentEmployeeId: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.review(id, dto, currentEmployeeId, companyId);
  }
}
