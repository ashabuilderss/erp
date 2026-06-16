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
import { PerformanceService } from './performance.service';
import { CreatePerformanceDto } from './dto/create-performance.dto';
import { UpdatePerformanceDto } from './dto/update-performance.dto';
import { QueryPerformanceDto } from './dto/query-performance.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  CurrentCompany,
  CurrentEmployeeId,
  CurrentUser,
} from '../../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('performance')
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get('me')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async getMyPerformance(
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.performanceService.getEmployeePerformance(
      employeeId!,
      companyId,
    );
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async create(
    @Body() dto: CreatePerformanceDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.performanceService.create(dto, companyId);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query() query: QueryPerformanceDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.performanceService.findAll(query, companyId);
  }

  @Get('average')
  @Roles(UserRole.ADMIN)
  async getAverage(
    @CurrentCompany('id') companyId: string,
    @Query('year') year?: number,
    @Query('quarter') quarter?: number,
  ) {
    return this.performanceService.getAverageScore(companyId, year, quarter);
  }

  @Get('employee/:employeeId')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async getByEmployee(
    @Param('employeeId') employeeId: string,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() currentEmployeeId: string | null,
    @CurrentUser('role') role: string,
    @Query('year') year?: number,
  ) {
    const resolvedId = role === 'EMPLOYEE' ? currentEmployeeId! : employeeId;
    return this.performanceService.getEmployeePerformance(
      resolvedId,
      companyId,
      year,
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findOne(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.performanceService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePerformanceDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.performanceService.update(id, dto, companyId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.performanceService.remove(id, companyId);
  }
}
