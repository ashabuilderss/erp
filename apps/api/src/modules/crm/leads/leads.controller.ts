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
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  CurrentCompany,
  CurrentEmployeeId,
  CurrentUser,
} from '../../../common/decorators/current-user.decorator';
import { UserRole, LeadStatus } from '@prisma/client';
import { CacheInvalidateExtra } from '../../../common/decorators/cache.decorators';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { Permissions } from '../../../common/auth/permissions';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get('me')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.LEAD_READ)
  async getMyLeads(
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.leadsService.getMyLeads(employeeId!, companyId);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.LEAD_CREATE)
  async create(
    @Body() dto: CreateLeadDto,
    @CurrentCompany('id') companyId: string,
    @CurrentUser('role') role: string,
    @CurrentEmployeeId() employeeId: string | null,
  ) {
    return this.leadsService.create(dto, companyId, role, employeeId ?? undefined);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.LEAD_READ)
  async findAll(
    @Query() query: QueryLeadDto,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentUser('role') role: string,
  ) {
    return this.leadsService.findAll(
      query,
      companyId,
      role === 'EMPLOYEE' ? employeeId! : undefined,
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.LEAD_READ)
  async findOne(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentUser('role') role: string,
  ) {
    return this.leadsService.findOne(id, companyId, role === 'EMPLOYEE' ? employeeId! : undefined);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.LEAD_UPDATE)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentUser('role') role: string,
  ) {
    return this.leadsService.update(id, dto, companyId, role === 'EMPLOYEE' ? employeeId! : undefined, role, employeeId ?? undefined);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.LEAD_UPDATE)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentUser('role') role: string,
  ) {
    return this.leadsService.updateStatus(id, status as LeadStatus, companyId, role === 'EMPLOYEE' ? employeeId! : undefined, role, employeeId ?? undefined);
  }

  @Post(':id/convert')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.LEAD_CONVERT)
  @CacheInvalidateExtra(['leads', 'customers', 'properties'])
  async convertToCustomer(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentUser('role') role: string,
  ) {
    return this.leadsService.convertToCustomer(id, companyId, role === 'EMPLOYEE' ? employeeId! : undefined);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @RequirePermissions(Permissions.LEAD_DELETE)
  async remove(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.leadsService.remove(id, companyId);
  }
}
