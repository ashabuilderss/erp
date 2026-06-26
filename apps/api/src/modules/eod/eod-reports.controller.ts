import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { EodReportsService } from './eod-reports.service';
import {
  CreateEodReportDto,
  UpdateEodReportDto,
} from './dto/create-eod-report.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentCompany,
  CurrentEmployeeId,
} from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('eod-reports')
export class EodReportsController {
  constructor(private readonly service: EodReportsService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  async findAll(
    @Query('date') date: string | undefined,
    @Query('employeeId') employeeId: string | undefined,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findAll(companyId, date, employeeId);
  }

  @Get('my')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  async findMy(
    @Query('date') date: string | undefined,
    @CurrentEmployeeId() employeeId: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findByEmployee(employeeId, companyId, date);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  async findOne(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findOne(id, companyId);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  async create(
    @Body() dto: CreateEodReportDto,
    @CurrentEmployeeId() employeeId: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.create(dto, employeeId, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEodReportDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.update(id, dto, companyId);
  }

  @Patch(':id/review')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  async review(
    @Param('id') id: string,
    @Body() dto: UpdateEodReportDto,
    @CurrentEmployeeId() currentEmployeeId: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.review(id, dto, currentEmployeeId, companyId);
  }
}
