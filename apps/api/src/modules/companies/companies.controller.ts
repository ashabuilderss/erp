import { Controller, Get, Patch, Body } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentCompany } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async findAll(@CurrentCompany('id') companyId: string) {
    return this.companiesService.findAll(companyId);
  }

  @Get('current')
  async findCurrent(@CurrentCompany('id') companyId: string) {
    return this.companiesService.findById(companyId);
  }

  @Patch('current')
  @Roles(UserRole.ADMIN)
  async updateCurrent(
    @Body() dto: UpdateCompanyDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.companiesService.update(companyId, dto);
  }
}
