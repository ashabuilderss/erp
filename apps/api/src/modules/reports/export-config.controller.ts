import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ExportConfigService } from './export-config.service';
import {
  CreateExportConfigDto,
  UpdateExportConfigDto,
} from './dto/export-config.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentCompany } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { Permissions } from '../../common/auth/permissions';
import { UseIdempotency } from '../../common/decorators/idempotency.decorator';

@Controller('reports/export-configs')
@Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.ACCOUNTS)
export class ExportConfigController {
  constructor(private readonly service: ExportConfigService) {}

  @Get()
  @RequirePermissions(Permissions.EXPORT_CONFIG_READ)
  async list(@CurrentCompany('id') companyId: string) {
    return this.service.list(companyId);
  }

  @Get(':id')
  @RequirePermissions(Permissions.EXPORT_CONFIG_READ)
  async getById(
    @CurrentCompany('id') companyId: string,
    @Param('id') id: string,
  ) {
    return this.service.getById(companyId, id);
  }

  @Post()
  @UseIdempotency()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.EXPORT_CONFIG_MANAGE)
  async create(
    @CurrentCompany('id') companyId: string,
    @Body() dto: CreateExportConfigDto,
  ) {
    return this.service.create(companyId, dto);
  }

  @Put(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.EXPORT_CONFIG_MANAGE)
  async update(
    @CurrentCompany('id') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateExportConfigDto,
  ) {
    return this.service.update(companyId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.EXPORT_CONFIG_MANAGE)
  async remove(
    @CurrentCompany('id') companyId: string,
    @Param('id') id: string,
  ) {
    return this.service.remove(companyId, id);
  }
}
