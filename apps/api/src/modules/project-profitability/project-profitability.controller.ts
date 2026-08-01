import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProjectProfitabilityService } from './project-profitability.service';
import {
  CreateProjectBudgetDto,
  UpdateProjectBudgetDto,
  QueryProjectProfitabilityDto,
} from './dto/create-project-budget.dto';
import { CreateCostEntryDto } from './dto/create-cost-entry.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permissions } from '../../common/auth/permissions';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { UseIdempotency } from '../../common/decorators/idempotency.decorator';

@Controller('project-profitability')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectProfitabilityController {
  constructor(
    private readonly profitabilityService: ProjectProfitabilityService,
  ) {}

  // ─── SUMMARY (must come before :id routes) ──────────────────────

  @Get('summary')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTS, UserRole.MANAGER)
  @RequirePermissions(Permissions.PROFITABILITY_VIEW)
  async getSummary(@CurrentUser('companyId') companyId: string) {
    return this.profitabilityService.getSummary(companyId);
  }

  // ─── LIST BUDGETS ───────────────────────────────────────────────

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTS, UserRole.MANAGER)
  @RequirePermissions(Permissions.PROFITABILITY_VIEW)
  async findAll(
    @CurrentUser('companyId') companyId: string,
    @Query() query: QueryProjectProfitabilityDto,
  ) {
    return this.profitabilityService.findAll(companyId, query);
  }

  // ─── CREATE BUDGET ──────────────────────────────────────────────

  @Post()
  @UseIdempotency()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTS)
  @RequirePermissions(Permissions.PROFITABILITY_VIEW)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateProjectBudgetDto,
  ) {
    return this.profitabilityService.create(dto, companyId);
  }

  // ─── GET BUDGET ─────────────────────────────────────────────────

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTS, UserRole.MANAGER)
  @RequirePermissions(Permissions.PROFITABILITY_VIEW)
  async findOne(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.profitabilityService.findOne(id, companyId);
  }

  // ─── UPDATE BUDGET ──────────────────────────────────────────────

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTS)
  @RequirePermissions(Permissions.PROFITABILITY_VIEW)
  async update(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProjectBudgetDto,
  ) {
    return this.profitabilityService.update(id, dto, companyId);
  }

  // ─── COST ENTRIES ───────────────────────────────────────────────

  @Get(':id/entries')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTS, UserRole.MANAGER)
  @RequirePermissions(Permissions.PROFITABILITY_VIEW)
  async listCostEntries(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.profitabilityService.listCostEntries(id, companyId);
  }

  @Post(':id/entries')
  @UseIdempotency()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTS)
  @RequirePermissions(Permissions.PROFITABILITY_VIEW)
  @HttpCode(HttpStatus.CREATED)
  async addCostEntry(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: CreateCostEntryDto,
  ) {
    return this.profitabilityService.addCostEntry(id, dto, companyId);
  }

  // ─── DELETE COST ENTRY ──────────────────────────────────────────

  @Delete('entries/:entryId')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTS)
  @RequirePermissions(Permissions.PROFITABILITY_VIEW)
  @HttpCode(HttpStatus.OK)
  async deleteCostEntry(
    @CurrentUser('companyId') companyId: string,
    @Param('entryId') entryId: string,
  ) {
    return this.profitabilityService.deleteCostEntry(entryId, companyId);
  }
}
