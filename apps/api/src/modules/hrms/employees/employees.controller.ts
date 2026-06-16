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
import {
  CurrentCompany,
  CurrentUser,
} from '../../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get('me')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  async getMyProfile(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.employeesService.getMyProfile(userId, role);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async create(
    @Body() dto: CreateEmployeeDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.employeesService.create(dto, companyId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  async findAll(
    @Query() query: QueryEmployeeDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.employeesService.findAll(query, companyId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async findOne(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.employeesService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.employeesService.update(id, dto, companyId);
  }

  @Post(':id/revoke-access')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async revokeAccess(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.employeesService.revokeAccess(id, companyId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.employeesService.remove(id, companyId);
  }
}
