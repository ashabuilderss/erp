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
import { AssetsService } from './assets.service';
import {
  CreateAssetDto,
  UpdateAssetDto,
  QueryAssetDto,
} from './dto/create-asset.dto';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { CreateRepairDto, UpdateRepairDto } from './dto/create-repair.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permissions } from '../../common/auth/permissions';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { UseIdempotency } from '../../common/decorators/idempotency.decorator';

@Controller('assets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssetsController {
  constructor(private readonly service: AssetsService) {}

  // ─── LIST / CREATE / SUMMARY ──────────────────────────────────────

  @Get('summary')
  @Roles(
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.ACCOUNTS,
  )
  @RequirePermissions(Permissions.ASSET_READ)
  async getSummary(@CurrentUser('companyId') companyId: string) {
    return this.service.getSummary(companyId);
  }

  @Get()
  @Roles(
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.ACCOUNTS,
    UserRole.MANAGER,
  )
  @RequirePermissions(Permissions.ASSET_READ)
  async findAll(
    @CurrentUser('companyId') companyId: string,
    @Query() query: QueryAssetDto,
  ) {
    return this.service.findAll(companyId, query);
  }

  @Post()
  @UseIdempotency()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.ASSET_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateAssetDto,
  ) {
    return this.service.create(companyId, dto);
  }

  // ─── SINGLE ASSET ─────────────────────────────────────────────────

  @Get(':id')
  @Roles(
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.ACCOUNTS,
    UserRole.MANAGER,
  )
  @RequirePermissions(Permissions.ASSET_READ)
  async findOne(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.service.findOne(companyId, id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.ASSET_UPDATE)
  async update(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAssetDto,
  ) {
    return this.service.update(companyId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.ASSET_DELETE)
  async remove(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.service.remove(companyId, id);
  }

  // ─── ASSIGNMENTS ──────────────────────────────────────────────────

  @Post(':id/assign')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.ASSET_ASSIGN)
  @HttpCode(HttpStatus.CREATED)
  async assign(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: CreateAssignmentDto,
  ) {
    return this.service.assign(companyId, id, dto);
  }

  @Post(':id/return')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.ASSET_ASSIGN)
  async returnAsset(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.service.returnAsset(companyId, id);
  }

  @Get(':id/assignments')
  @Roles(
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.ACCOUNTS,
  )
  @RequirePermissions(Permissions.ASSET_READ)
  async listAssignments(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.service.listAssignments(companyId, id);
  }

  // ─── REPAIRS ──────────────────────────────────────────────────────

  @Post(':id/repairs')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.ASSET_REPAIR)
  @HttpCode(HttpStatus.CREATED)
  async createRepair(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: CreateRepairDto,
  ) {
    return this.service.createRepair(companyId, id, dto);
  }

  @Patch('repairs/:repairId')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.ASSET_REPAIR)
  async updateRepair(
    @CurrentUser('companyId') companyId: string,
    @Param('repairId') repairId: string,
    @Body() dto: UpdateRepairDto,
  ) {
    return this.service.updateRepair(companyId, repairId, dto);
  }
}
