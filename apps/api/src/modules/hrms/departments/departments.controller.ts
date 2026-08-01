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
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { QueryDepartmentDto } from './dto/query-department.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { Permissions } from '../../../common/auth/permissions';
import { CurrentCompany } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { UseIdempotency } from '../../../common/decorators/idempotency.decorator';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @UseIdempotency()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  @RequirePermissions(Permissions.DEPARTMENT_CREATE)
  async create(
    @Body() dto: CreateDepartmentDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.departmentsService.create(dto, companyId);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  @RequirePermissions(Permissions.DEPARTMENT_READ)
  async findAll(
    @Query() query: QueryDepartmentDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.departmentsService.findAll(query, companyId);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  @RequirePermissions(Permissions.DEPARTMENT_READ)
  async findOne(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.departmentsService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  @RequirePermissions(Permissions.DEPARTMENT_UPDATE)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.departmentsService.update(id, dto, companyId);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.DEPARTMENT_DELETE)
  async remove(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.departmentsService.remove(id, companyId);
  }
}
