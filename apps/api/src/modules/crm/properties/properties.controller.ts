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
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { UpdatePropertyStatusDto } from './dto/update-property-status.dto';
import { QueryPropertyDto } from './dto/query-property.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  CurrentCompany,
  CurrentEmployeeId,
  CurrentUser,
} from '../../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { Permissions } from '../../../common/auth/permissions';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get('me')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.PROPERTY_READ)
  async getMyProperties(
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.propertiesService.getMyProperties(employeeId!, companyId);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.PROPERTY_CREATE)
  async create(
    @Body() dto: CreatePropertyDto,
    @CurrentCompany('id') companyId: string,
    @CurrentUser('role') role: string,
    @CurrentEmployeeId() employeeId: string | null,
  ) {
    return this.propertiesService.create(dto, companyId, role, employeeId ?? undefined);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.PROPERTY_READ)
  async findAll(
    @Query() query: QueryPropertyDto,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentUser('role') role: string,
  ) {
    return this.propertiesService.findAll(
      query,
      companyId,
      role === 'EMPLOYEE' ? employeeId! : undefined,
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.PROPERTY_READ)
  async findOne(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentUser('role') role: string,
  ) {
    return this.propertiesService.findOne(id, companyId, role === 'EMPLOYEE' ? employeeId! : undefined);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.PROPERTY_UPDATE)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePropertyDto,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentUser('role') role: string,
  ) {
    return this.propertiesService.update(
      id,
      dto,
      companyId,
      role === 'EMPLOYEE' ? employeeId! : undefined,
      role,
      employeeId ?? undefined,
    );
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.PROPERTY_UPDATE)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePropertyStatusDto,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentUser('role') role: string,
  ) {
    return this.propertiesService.updateStatus(id, dto.status, companyId, role === 'EMPLOYEE' ? employeeId! : undefined, role, employeeId ?? undefined);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @RequirePermissions(Permissions.PROPERTY_DELETE)
  async remove(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.propertiesService.remove(id, companyId);
  }
}
