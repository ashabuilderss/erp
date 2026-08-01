import { Controller, Get, Patch, Body } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permissions } from '../../common/auth/permissions';
import { CurrentCompany } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.COMPANY_READ)
  async findAll(@CurrentCompany('id') companyId: string) {
    return this.companiesService.findAll(companyId);
  }

  @Get('current')
  @RequirePermissions(Permissions.COMPANY_READ)
  async findCurrent(@CurrentCompany('id') companyId: string) {
    return this.companiesService.findById(companyId);
  }

  @Patch('current')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.COMPANY_UPDATE)
  async updateCurrent(
    @Body() dto: UpdateCompanyDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.companiesService.update(companyId, dto);
  }

  @Get('current/settings')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.COMPANY_READ)
  async getSettings(@CurrentCompany('id') companyId: string) {
    return this.companiesService.getSettings(companyId);
  }

  @Patch('current/settings')
  @Roles(UserRole.OWNER)
  @RequirePermissions(Permissions.COMPANY_UPDATE)
  async updateSettings(
    @Body() dto: UpdateSettingsDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.companiesService.updateSettings(companyId, dto);
  }
}
