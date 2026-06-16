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
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentCompany } from '../../../common/decorators/current-user.decorator';
import { UserRole, SiteVisitStatus } from '@prisma/client';

@Controller('site-visits')
export class SiteVisitsController {
  constructor(private readonly siteVisitsService: SiteVisitsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async create(
    @Body() dto: CreateSiteVisitDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.siteVisitsService.create(dto, companyId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async findAll(
    @Query() query: QuerySiteVisitDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.siteVisitsService.findAll(query, companyId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async findOne(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.siteVisitsService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSiteVisitDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.siteVisitsService.update(id, dto, companyId);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.siteVisitsService.updateStatus(
      id,
      status as SiteVisitStatus,
      companyId,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.siteVisitsService.remove(id, companyId);
  }
}
