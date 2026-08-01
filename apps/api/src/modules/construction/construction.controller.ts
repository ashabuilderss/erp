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
import { ConstructionService } from './construction.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permissions } from '../../common/auth/permissions';
import { CurrentCompany, CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { CacheInvalidateExtra } from '../../common/decorators/cache.decorators';
import {
  CreateSiteDto,
  UpdateSiteDto,
  QuerySiteDto,
  CreatePhaseDto,
  UpdatePhaseDto,
  CreateVendorDto,
  UpdateVendorDto,
  QueryVendorDto,
  CreateMaterialDto,
  UpdateMaterialDto,
  QueryMaterialDto,
  CreateMaterialInwardDto,
  UpdateMaterialInwardDto,
  CreateLabourEntryDto,
  CreateProgressPhotoDto,
  CreateConsumptionDto,
} from './dto';
import { QueryMaterialInwardDto } from './dto/query-material-inward.dto';
import { QueryInventoryDto } from './dto/query-inventory.dto';
import { QueryLabourEntryDto } from './dto/query-labour-entry.dto';
import { QueryConsumptionDto } from './dto/query-consumption.dto';

@Controller()
export class ConstructionController {
  constructor(private readonly service: ConstructionService) {}

  // --- Sites ---
  @Post('construction-sites')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.CONSTRUCTION_CREATE)
  async createSite(
    @Body() dto: CreateSiteDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.createSite(dto, companyId);
  }

  @Get('construction-sites')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.CONSTRUCTION_READ)
  async findAllSites(
    @Query() query: QuerySiteDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findAllSites(query, companyId);
  }

  @Get('construction-sites/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.CONSTRUCTION_READ)
  async findOneSite(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findOneSite(id, companyId);
  }

  @Patch('construction-sites/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.CONSTRUCTION_CREATE)
  async updateSite(
    @Param('id') id: string,
    @Body() dto: UpdateSiteDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.updateSite(id, dto, companyId);
  }

  @Delete('construction-sites/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.CONSTRUCTION_CREATE)
  async deleteSite(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.deleteSite(id, companyId);
  }

  // --- Phases ---
  @Post('construction-sites/:siteId/phases')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.CONSTRUCTION_CREATE)
  async createPhase(
    @Param('siteId') siteId: string,
    @Body() dto: CreatePhaseDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.createPhase(siteId, dto, companyId);
  }

  @Patch('phases/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.CONSTRUCTION_CREATE)
  async updatePhase(
    @Param('id') id: string,
    @Body() dto: UpdatePhaseDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.updatePhase(id, dto, companyId);
  }

  @Delete('phases/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.CONSTRUCTION_CREATE)
  async deletePhase(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.deletePhase(id, companyId);
  }

  // --- Vendors ---
  @Post('vendors')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.CONSTRUCTION_CREATE)
  async createVendor(
    @Body() dto: CreateVendorDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.createVendor(dto, companyId);
  }

  @Get('vendors')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE, UserRole.ACCOUNTS, UserRole.MANAGER, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.CONSTRUCTION_READ)
  async findAllVendors(
    @Query() query: QueryVendorDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findAllVendors(query, companyId);
  }

  @Get('vendors/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE, UserRole.ACCOUNTS, UserRole.MANAGER, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.CONSTRUCTION_READ)
  async findOneVendor(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findOneVendor(id, companyId);
  }

  @Patch('vendors/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.CONSTRUCTION_CREATE)
  async updateVendor(
    @Param('id') id: string,
    @Body() dto: UpdateVendorDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.updateVendor(id, dto, companyId);
  }

  @Delete('vendors/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.CONSTRUCTION_CREATE)
  async deleteVendor(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.deleteVendor(id, companyId);
  }

  // --- Materials ---
  @Post('materials')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.CONSTRUCTION_CREATE)
  async createMaterial(
    @Body() dto: CreateMaterialDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.createMaterial(dto, companyId);
  }

  @Get('materials')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.CONSTRUCTION_READ)
  async findAllMaterials(
    @Query() query: QueryMaterialDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findAllMaterials(query, companyId);
  }

  @Patch('materials/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.CONSTRUCTION_CREATE)
  async updateMaterial(
    @Param('id') id: string,
    @Body() dto: UpdateMaterialDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.updateMaterial(id, dto, companyId);
  }

  @Delete('materials/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.CONSTRUCTION_CREATE)
  async deleteMaterial(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.deleteMaterial(id, companyId);
  }

  // --- Material Inward ---
  @Post('material-inward')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.CONSTRUCTION_CREATE)
  @CacheInvalidateExtra(['material-inward', 'inventory'])
  async createMaterialInward(
    @Body() dto: CreateMaterialInwardDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.createMaterialInward(dto, companyId);
  }

  @Patch('material-inward/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.CONSTRUCTION_CREATE)
  @CacheInvalidateExtra(['material-inward', 'inventory'])
  async updateMaterialInward(
    @Param('id') id: string,
    @Body() dto: UpdateMaterialInwardDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.updateMaterialInward(id, dto, companyId);
  }

  @Delete('material-inward/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.CONSTRUCTION_CREATE)
  @CacheInvalidateExtra(['material-inward', 'inventory'])
  async deleteMaterialInward(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.deleteMaterialInward(id, companyId);
  }

  @Get('material-inward')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.CONSTRUCTION_READ)
  async findAllMaterialInward(
    @Query() query: QueryMaterialInwardDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findAllMaterialInward(query, companyId);
  }

  // --- Inventory ---
  @Get('inventory')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.CONSTRUCTION_READ)
  async findInventory(
    @Query() query: QueryInventoryDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findInventory(query, companyId);
  }

  // --- Labour ---
  @Post('labour-entries')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.CONSTRUCTION_CREATE)
  async createLabourEntry(
    @Body() dto: CreateLabourEntryDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.createLabourEntry(dto, companyId);
  }

  @Get('labour-entries')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.CONSTRUCTION_READ)
  async findAllLabourEntries(
    @Query() query: QueryLabourEntryDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findAllLabourEntries(query, companyId);
  }

  @Delete('labour-entries/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.CONSTRUCTION_CREATE)
  async deleteLabourEntry(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.deleteLabourEntry(id, companyId);
  }

  // --- Material Consumption ---
  @Post('consumption')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.CONSUMPTION_CREATE)
  @CacheInvalidateExtra(['consumption', 'inventory'])
  async createConsumption(
    @Body() dto: CreateConsumptionDto,
    @CurrentCompany('id') companyId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.createConsumption(dto, companyId, userId);
  }

  @Get('consumption')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.CONSUMPTION_READ)
  async findAllConsumptions(
    @Query() query: QueryConsumptionDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findAllConsumptions(query, companyId);
  }

  @Delete('consumption/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.CONSUMPTION_DELETE)
  @CacheInvalidateExtra(['consumption', 'inventory'])
  async deleteConsumption(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.deleteConsumption(id, companyId);
  }

  // --- Progress Photos ---
  @Post('progress-photos')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.CONSTRUCTION_CREATE)
  async createProgressPhoto(
    @Body() dto: CreateProgressPhotoDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.createProgressPhoto(dto, companyId);
  }

  @Get('construction-sites/:siteId/photos')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.CONSTRUCTION_READ)
  async findSitePhotos(
    @Param('siteId') siteId: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findSitePhotos(siteId, companyId);
  }

  @Delete('progress-photos/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.CONSTRUCTION_CREATE)
  async deleteProgressPhoto(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.deleteProgressPhoto(id, companyId);
  }
}
