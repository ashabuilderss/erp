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
import { IncentivesService } from './incentives.service';
import { CreateIncentiveDto } from './dto/create-incentive.dto';
import { UpdateIncentiveDto } from './dto/update-incentive.dto';
import { QueryIncentiveDto } from './dto/query-incentive.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permissions } from '../../common/auth/permissions';
import { CurrentCompany } from '../../common/decorators/current-user.decorator';
import { CurrentEmployeeId } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { UseIdempotency } from '../../common/decorators/idempotency.decorator';

@Controller('incentives')
export class IncentivesController {
  constructor(private readonly incentivesService: IncentivesService) {}

  @Post()
  @UseIdempotency()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.INCENTIVE_CREATE)
  async create(
    @Body() dto: CreateIncentiveDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.incentivesService.create(dto, companyId);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.INCENTIVE_READ)
  async findAll(
    @Query() query: QueryIncentiveDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.incentivesService.findAll(companyId, query);
  }

  @Get('active')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.INCENTIVE_READ)
  async findActive(
    @Query() query: QueryIncentiveDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.incentivesService.findActive(companyId, query);
  }

  @Get('leaderboard')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.INCENTIVE_READ)
  async leaderboard(
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
  ) {
    return this.incentivesService.leaderboard(companyId, employeeId);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.INCENTIVE_READ)
  async findOne(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.incentivesService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.INCENTIVE_CREATE)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateIncentiveDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.incentivesService.update(id, dto, companyId);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.INCENTIVE_CREATE)
  async remove(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.incentivesService.remove(id, companyId);
  }
}
