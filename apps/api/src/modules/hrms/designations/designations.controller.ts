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
import { CurrentCompany } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('designations')
export class DesignationsController {
  constructor(private readonly designationsService: DesignationsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async create(
    @Body() dto: CreateDesignationDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.designationsService.create(dto, companyId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async findAll(
    @Query() query: QueryDesignationDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.designationsService.findAll(query, companyId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async findOne(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.designationsService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDesignationDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.designationsService.update(id, dto, companyId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.designationsService.remove(id, companyId);
  }
}
