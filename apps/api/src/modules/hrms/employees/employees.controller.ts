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
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';

import { Roles } from '../../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { Permissions } from '../../../common/auth/permissions';
import {
  CurrentCompany,
  CurrentEmployeeId,
  CurrentUser,
} from '../../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { UseIdempotency } from '../../../common/decorators/idempotency.decorator';
import { getDirectScopeFilter } from '../../../common/utils/scope-helper.util';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get('me')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.TEAM_LEAD, UserRole.ACCOUNTS, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.EMPLOYEE_READ)
  async getMyProfile(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.employeesService.getMyProfile(userId, role);
  }

  @Post()
  @UseIdempotency()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.EMPLOYEE_CREATE)
  async create(
    @Body() dto: CreateEmployeeDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.employeesService.create(dto, companyId);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.TEAM_LEAD, UserRole.ACCOUNTS)
  @RequirePermissions(Permissions.EMPLOYEE_READ)
  async findAll(
    @Query() query: QueryEmployeeDto,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentUser('scopes') scopes: Record<string, string>,
    @CurrentUser('role') role: string,
    @CurrentUser('teamId') teamId: string | null,
    @CurrentUser('departmentId') departmentId: string | null,
  ) {
    const scopeFilter = getDirectScopeFilter(scopes, Permissions.EMPLOYEE_READ, {
      companyId,
      employeeId,
      teamId,
      departmentId,
    });
    return this.employeesService.findAll(query, scopeFilter, role);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.EMPLOYEE_READ)
  async findOne(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.employeesService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.EMPLOYEE_UPDATE)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.employeesService.update(id, dto, companyId);
  }

  @Post(':id/invite')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.EMPLOYEE_UPDATE)
  async invite(
    @Param('id') id: string,
    @Body('email') email: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.employeesService.invite(id, email, companyId);
  }

  @Post(':id/revoke-access')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.EMPLOYEE_UPDATE)
  async revokeAccess(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.employeesService.revokeAccess(id, companyId);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.EMPLOYEE_DELETE)
  async remove(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.employeesService.remove(id, companyId);
  }
}
