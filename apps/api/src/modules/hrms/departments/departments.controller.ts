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
import { CurrentCompany } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async create(
    @Body() dto: CreateDepartmentDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.departmentsService.create(dto, companyId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async findAll(
    @Query() query: QueryDepartmentDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.departmentsService.findAll(query, companyId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async findOne(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.departmentsService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.departmentsService.update(id, dto, companyId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.departmentsService.remove(id, companyId);
  }
}
