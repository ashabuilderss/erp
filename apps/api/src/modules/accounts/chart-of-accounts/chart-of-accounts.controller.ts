import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ChartOfAccountsService } from './chart-of-accounts.service';
import { CreateChartOfAccountDto } from './dto/create-chart-of-account.dto';
import { UpdateChartOfAccountDto } from './dto/update-chart-of-account.dto';
import { QueryChartOfAccountDto } from './dto/query-chart-of-account.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { Permissions } from '../../../common/auth/permissions';
import { CurrentCompany } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('chart-of-accounts')
export class ChartOfAccountsController {
  constructor(private readonly service: ChartOfAccountsService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTS)
  @RequirePermissions(Permissions.ACCOUNT_CREATE)
  create(
    @Body() dto: CreateChartOfAccountDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.create(dto, companyId);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTS)
  @RequirePermissions(Permissions.ACCOUNT_READ)
  findAll(
    @Query() query: QueryChartOfAccountDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findAll(query, companyId);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTS)
  @RequirePermissions(Permissions.ACCOUNT_READ)
  findOne(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTS)
  @RequirePermissions(Permissions.ACCOUNT_UPDATE)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateChartOfAccountDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.update(id, dto, companyId);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.ACCOUNT_DELETE)
  remove(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.remove(id, companyId);
  }
}
