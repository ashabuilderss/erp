import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permissions } from '../../common/auth/permissions';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { UseIdempotency } from '../../common/decorators/idempotency.decorator';
import {
  RecordInwardDto,
  RecordOutwardDto,
  RecordWastageDto,
  RecordTransferDto,
} from './dto/record-transaction.dto';
import { QueryInventoryDto } from './dto/query-inventory.dto';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ─── LIST / CREATE ─────────────────────────────────────────────────

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.ACCOUNTS, UserRole.MANAGER, UserRole.TEAM_LEAD, UserRole.EMPLOYEE, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.INVENTORY_READ)
  async findAll(
    @CurrentUser('companyId') companyId: string,
    @Query() query: QueryInventoryDto,
  ) {
    return this.inventoryService.findAll(companyId, query);
  }

  @Post()
  @UseIdempotency()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.ACCOUNTS)
  @RequirePermissions(Permissions.INVENTORY_CREATE)
  async create(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateInventoryItemDto,
  ) {
    return this.inventoryService.create(companyId, dto);
  }

  // ─── ALERTS / SUMMARY / SNAPSHOTS ─────────────────────────────────

  @Get('alerts')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.ACCOUNTS, UserRole.MANAGER)
  @RequirePermissions(Permissions.INVENTORY_READ)
  async getLowStockAlerts(@CurrentUser('companyId') companyId: string) {
    return this.inventoryService.getLowStockAlerts(companyId);
  }

  @Get('summary')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.ACCOUNTS, UserRole.MANAGER)
  @RequirePermissions(Permissions.INVENTORY_READ)
  async getStockSummary(@CurrentUser('companyId') companyId: string) {
    return this.inventoryService.getStockSummary(companyId);
  }

  @Post('snapshots')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.INVENTORY_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async createSnapshots(@CurrentUser('companyId') companyId: string) {
    return this.inventoryService.createSnapshots(companyId);
  }

  // ─── SINGLE ITEM ──────────────────────────────────────────────────

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.ACCOUNTS, UserRole.MANAGER, UserRole.TEAM_LEAD, UserRole.EMPLOYEE, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.INVENTORY_READ)
  async findOne(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.inventoryService.findOne(companyId, id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.ACCOUNTS)
  @RequirePermissions(Permissions.INVENTORY_UPDATE)
  async update(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateInventoryItemDto,
  ) {
    return this.inventoryService.update(companyId, id, dto);
  }

  // ─── TRANSACTIONS ─────────────────────────────────────────────────

  @Post(':id/inward')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.ACCOUNTS)
  @RequirePermissions(Permissions.INVENTORY_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async recordInward(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: RecordInwardDto,
  ) {
    return this.inventoryService.recordInward(companyId, id, userId, dto);
  }

  @Post(':id/outward')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.ACCOUNTS, UserRole.MANAGER)
  @RequirePermissions(Permissions.INVENTORY_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async recordOutward(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: RecordOutwardDto,
  ) {
    return this.inventoryService.recordOutward(companyId, id, userId, dto);
  }

  @Post(':id/wastage')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.ACCOUNTS, UserRole.MANAGER)
  @RequirePermissions(Permissions.INVENTORY_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async recordWastage(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: RecordWastageDto,
  ) {
    return this.inventoryService.recordWastage(companyId, id, userId, dto);
  }

  @Post(':id/transfer')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.ACCOUNTS)
  @RequirePermissions(Permissions.INVENTORY_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async recordTransfer(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: RecordTransferDto,
  ) {
    return this.inventoryService.recordTransfer(companyId, id, userId, dto);
  }
}
