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
import { DesignationsService } from './designations.service';
import { CreateDesignationDto } from './dto/create-designation.dto';
import { UpdateDesignationDto } from './dto/update-designation.dto';
import { QueryDesignationDto } from './dto/query-designation.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { Permissions } from '../../../common/auth/permissions';
import { CurrentCompany } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { UseIdempotency } from '../../../common/decorators/idempotency.decorator';

@Controller('designations')
export class DesignationsController {
  constructor(private readonly designationsService: DesignationsService) {}

  @Post()
  @UseIdempotency()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  @RequirePermissions(Permissions.DESIGNATION_CREATE)
  async create(
    @Body() dto: CreateDesignationDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.designationsService.create(dto, companyId);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  @RequirePermissions(Permissions.DESIGNATION_READ)
  async findAll(
    @Query() query: QueryDesignationDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.designationsService.findAll(query, companyId);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  @RequirePermissions(Permissions.DESIGNATION_READ)
  async findOne(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.designationsService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  @RequirePermissions(Permissions.DESIGNATION_UPDATE)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDesignationDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.designationsService.update(id, dto, companyId);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.DESIGNATION_DELETE)
  async remove(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.designationsService.remove(id, companyId);
  }
}
