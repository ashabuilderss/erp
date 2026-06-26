import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { CommissionService } from './commission.service';
import { CreateCommissionDto } from './dto/create-commission.dto';
import { QueryCommissionDto } from './dto/query-commission.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentCompany } from '../../common/decorators/current-user.decorator';
import { UserRole, CommissionStatus } from '@prisma/client';

@Controller('commissions')
export class CommissionController {
  constructor(private readonly commissionService: CommissionService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async create(
    @Body() dto: CreateCommissionDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.commissionService.create(dto, companyId);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  async findAll(
    @Query() query: QueryCommissionDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.commissionService.findAll(query, companyId);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  async findOne(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.commissionService.findOne(id, companyId);
  }

  @Patch(':id/status')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: CommissionStatus },
    @CurrentCompany('id') companyId: string,
  ) {
    return this.commissionService.updateStatus(id, body.status, companyId);
  }
}
