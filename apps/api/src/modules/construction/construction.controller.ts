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
import { CurrentCompany } from '../../common/decorators/current-user.decorator';
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
} from './dto';

@Controller()
export class ConstructionController {
  constructor(private readonly service: ConstructionService) {}

  // --- Sites ---
  @Post('construction-sites')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async createSite(
    @Body() dto: CreateSiteDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.createSite(dto, companyId);
  }

  @Get('construction-sites')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  async findAllSites(
    @Query() query: QuerySiteDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findAllSites(query, companyId);
  }

  @Get('construction-sites/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  async findOneSite(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findOneSite(id, companyId);
  }

  @Patch('construction-sites/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async updateSite(
    @Param('id') id: string,
    @Body() dto: UpdateSiteDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.updateSite(id, dto, companyId);
  }

  @Delete('construction-sites/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async deleteSite(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.deleteSite(id, companyId);
  }

  // --- Phases ---
  @Post('construction-sites/:siteId/phases')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async createPhase(
    @Param('siteId') siteId: string,
    @Body() dto: CreatePhaseDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.createPhase(siteId, dto, companyId);
  }

  @Patch('phases/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async updatePhase(
    @Param('id') id: string,
    @Body() dto: UpdatePhaseDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.updatePhase(id, dto, companyId);
  }

  @Delete('phases/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async deletePhase(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.deletePhase(id, companyId);
  }

  // --- Vendors ---
  @Post('vendors')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async createVendor(
    @Body() dto: CreateVendorDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.createVendor(dto, companyId);
  }

  @Get('vendors')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  async findAllVendors(
    @Query() query: QueryVendorDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findAllVendors(query, companyId);
  }

  @Get('vendors/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async findOneVendor(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findOneVendor(id, companyId);
  }

  @Patch('vendors/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async updateVendor(
    @Param('id') id: string,
    @Body() dto: UpdateVendorDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.updateVendor(id, dto, companyId);
  }

  @Delete('vendors/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async deleteVendor(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.deleteVendor(id, companyId);
  }

  // --- Materials ---
  @Post('materials')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async createMaterial(
    @Body() dto: CreateMaterialDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.createMaterial(dto, companyId);
  }

  @Get('materials')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  async findAllMaterials(
    @Query() query: QueryMaterialDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findAllMaterials(query, companyId);
  }

  @Patch('materials/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async updateMaterial(
    @Param('id') id: string,
    @Body() dto: UpdateMaterialDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.updateMaterial(id, dto, companyId);
  }

  @Delete('materials/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async deleteMaterial(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.deleteMaterial(id, companyId);
  }

  // --- Material Inward ---
  @Post('material-inward')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @CacheInvalidateExtra(['material-inward', 'inventory'])
  async createMaterialInward(
    @Body() dto: CreateMaterialInwardDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.createMaterialInward(dto, companyId);
  }

  @Patch('material-inward/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
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
  @CacheInvalidateExtra(['material-inward', 'inventory'])
  async deleteMaterialInward(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.deleteMaterialInward(id, companyId);
  }

  @Get('material-inward')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  async findAllMaterialInward(
    @Query() query: any,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findAllMaterialInward(query, companyId);
  }

  // --- Inventory ---
  @Get('inventory')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  async findInventory(
    @Query() query: any,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findInventory(query, companyId);
  }

  // --- Labour ---
  @Post('labour-entries')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async createLabourEntry(
    @Body() dto: CreateLabourEntryDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.createLabourEntry(dto, companyId);
  }

  @Get('labour-entries')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  async findAllLabourEntries(
    @Query() query: any,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findAllLabourEntries(query, companyId);
  }

  @Delete('labour-entries/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async deleteLabourEntry(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.deleteLabourEntry(id, companyId);
  }

  // --- Progress Photos ---
  @Post('progress-photos')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async createProgressPhoto(
    @Body() dto: CreateProgressPhotoDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.createProgressPhoto(dto, companyId);
  }

  @Get('construction-sites/:siteId/photos')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  async findSitePhotos(
    @Param('siteId') siteId: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findSitePhotos(siteId, companyId);
  }

  @Delete('progress-photos/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async deleteProgressPhoto(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.deleteProgressPhoto(id, companyId);
  }
}
