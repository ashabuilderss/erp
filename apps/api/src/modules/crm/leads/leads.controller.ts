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

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get('me')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async getMyLeads(
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.leadsService.getMyLeads(employeeId!, companyId);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async create(
    @Body() dto: CreateLeadDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.leadsService.create(dto, companyId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
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
  async findOne(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.leadsService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.leadsService.update(id, dto, companyId);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.leadsService.updateStatus(id, status as LeadStatus, companyId);
  }

  @Post(':id/convert')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async convertToCustomer(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.leadsService.convertToCustomer(id, companyId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.leadsService.remove(id, companyId);
  }
}
