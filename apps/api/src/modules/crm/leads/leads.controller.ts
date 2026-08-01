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
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { QueryLeadDto } from './dto/query-lead.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  CurrentCompany,
  CurrentEmployeeId,
  CurrentUser,
} from '../../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { CacheInvalidateExtra } from '../../../common/decorators/cache.decorators';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { Permissions } from '../../../common/auth/permissions';
import { UseIdempotency } from '../../../common/decorators/idempotency.decorator';
import { getEffectiveScopeFilter } from '../../../common/utils/scope-helper.util';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get('me')
  @Roles(
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.EMPLOYEE,
    UserRole.MANAGER,
    UserRole.FIELD_EMPLOYEE,
  )
  @RequirePermissions(Permissions.LEAD_READ)
  async getMyLeads(
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.leadsService.getMyLeads(employeeId!, companyId);
  }

  @Post()
  @UseIdempotency()
  @Roles(
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.EMPLOYEE,
    UserRole.MANAGER,
    UserRole.FIELD_EMPLOYEE,
  )
  @RequirePermissions(Permissions.LEAD_CREATE)
  async create(
    @Body() dto: CreateLeadDto,
    @CurrentCompany('id') companyId: string,
    @CurrentUser('role') role: string,
    @CurrentEmployeeId() employeeId: string | null,
  ) {
    return this.leadsService.create(
      dto,
      companyId,
      role,
      employeeId ?? undefined,
    );
  }

  @Get()
  @Roles(
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.EMPLOYEE,
    UserRole.MANAGER,
    UserRole.FIELD_EMPLOYEE,
  )
  @RequirePermissions(Permissions.LEAD_READ)
  async findAll(
    @Query() query: QueryLeadDto,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentUser('scopes') scopes: Record<string, string>,
    @CurrentUser('teamId') teamId: string | null,
    @CurrentUser('departmentId') departmentId: string | null,
  ) {
    const scopeFilter = getEffectiveScopeFilter(scopes, Permissions.LEAD_READ, {
      companyId,
      employeeId,
      teamId,
      departmentId,
    });
    return this.leadsService.findAll(query, scopeFilter);
  }

  @Get(':id')
  @Roles(
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.EMPLOYEE,
    UserRole.MANAGER,
    UserRole.FIELD_EMPLOYEE,
  )
  @RequirePermissions(Permissions.LEAD_READ)
  async findOne(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentUser('scopes') scopes: Record<string, string>,
    @CurrentUser('teamId') teamId: string | null,
    @CurrentUser('departmentId') departmentId: string | null,
  ) {
    const scopeFilter = getEffectiveScopeFilter(scopes, Permissions.LEAD_READ, {
      companyId,
      employeeId,
      teamId,
      departmentId,
    });
    return this.leadsService.findOne(id, scopeFilter);
  }

  @Patch(':id')
  @Roles(
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.EMPLOYEE,
    UserRole.MANAGER,
    UserRole.FIELD_EMPLOYEE,
  )
  @RequirePermissions(Permissions.LEAD_UPDATE)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentUser('scopes') scopes: Record<string, string>,
    @CurrentUser('role') role: string,
    @CurrentUser('teamId') teamId: string | null,
    @CurrentUser('departmentId') departmentId: string | null,
  ) {
    const scopeFilter = getEffectiveScopeFilter(scopes, Permissions.LEAD_UPDATE, {
      companyId,
      employeeId,
      teamId,
      departmentId,
    });
    return this.leadsService.update(
      id,
      dto,
      companyId,
      scopeFilter,
      role,
      employeeId ?? undefined,
    );
  }

  @Patch(':id/status')
  @Roles(
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.EMPLOYEE,
    UserRole.MANAGER,
    UserRole.FIELD_EMPLOYEE,
  )
  @RequirePermissions(Permissions.LEAD_UPDATE)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateLeadStatusDto,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentUser('scopes') scopes: Record<string, string>,
    @CurrentUser('role') role: string,
    @CurrentUser('teamId') teamId: string | null,
    @CurrentUser('departmentId') departmentId: string | null,
  ) {
    const scopeFilter = getEffectiveScopeFilter(scopes, Permissions.LEAD_UPDATE, {
      companyId,
      employeeId,
      teamId,
      departmentId,
    });
    return this.leadsService.updateStatus(
      id,
      dto.status,
      companyId,
      scopeFilter,
      role,
      employeeId ?? undefined,
      dto.lostReason,
    );
  }

  @Post(':id/convert')
  @UseIdempotency()
  @Roles(
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.EMPLOYEE,
    UserRole.MANAGER,
    UserRole.FIELD_EMPLOYEE,
  )
  @RequirePermissions(Permissions.LEAD_CONVERT)
  @CacheInvalidateExtra(['leads', 'customers', 'properties'])
  async convertToCustomer(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentUser('scopes') scopes: Record<string, string>,
    @CurrentUser('teamId') teamId: string | null,
    @CurrentUser('departmentId') departmentId: string | null,
  ) {
    const scopeFilter = getEffectiveScopeFilter(scopes, Permissions.LEAD_CONVERT, {
      companyId,
      employeeId,
      teamId,
      departmentId,
    });
    return this.leadsService.convertToCustomer(id, scopeFilter);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.LEAD_DELETE)
  async remove(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.leadsService.remove(id, companyId);
  }
}
