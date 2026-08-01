import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { CommissionService } from './commission.service';
import { CreateCommissionDto } from './dto/create-commission.dto';
import { QueryCommissionDto } from './dto/query-commission.dto';
import { UpdateCommissionStatusDto } from './dto/update-commission-status.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permissions } from '../../common/auth/permissions';
import { CurrentCompany } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { NoCache } from '../../common/decorators/cache.decorators';
import { UseIdempotency } from '../../common/decorators/idempotency.decorator';

@Controller('commissions')
export class CommissionController {
  constructor(private readonly commissionService: CommissionService) {}

  @Post()
  @UseIdempotency()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.COMMISSION_UPDATE)
  async create(
    @Body() dto: CreateCommissionDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.commissionService.create(dto, companyId);
  }

  @Get()
  @NoCache()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.COMMISSION_READ)
  async findAll(
    @Query() query: QueryCommissionDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.commissionService.findAll(query, companyId);
  }

  @Get(':id')
  @NoCache()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.COMMISSION_READ)
  async findOne(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.commissionService.findOne(id, companyId);
  }

  @Patch(':id/status')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.COMMISSION_UPDATE)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCommissionStatusDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.commissionService.updateStatus(id, dto.status, companyId);
  }
}
