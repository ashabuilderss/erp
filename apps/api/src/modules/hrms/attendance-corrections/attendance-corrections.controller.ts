import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { AttendanceCorrectionsService } from './attendance-corrections.service';
import { CreateAttendanceCorrectionDto } from './dto/create-attendance-correction.dto';
import { QueryAttendanceCorrectionDto } from './dto/query-attendance-correction.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { Permissions } from '../../../common/auth/permissions';
import {
  CurrentCompany,
  CurrentEmployeeId,
} from '../../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { CacheInvalidateExtra } from '../../../common/decorators/cache.decorators';

@Controller('attendance-corrections')
export class AttendanceCorrectionsController {
  constructor(private readonly service: AttendanceCorrectionsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.ATTENDANCE_CREATE)
  async create(
    @Body() dto: CreateAttendanceCorrectionDto,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.create(dto, employeeId!, companyId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.ATTENDANCE_READ)
  async findAll(
    @Query() query: QueryAttendanceCorrectionDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findAll(query, companyId);
  }

  @Get('me')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.ATTENDANCE_READ)
  async findMyCorrections(@CurrentEmployeeId() employeeId: string | null) {
    return this.service.findMyCorrections(employeeId!);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.ATTENDANCE_READ)
  async findOne(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findOne(id, companyId);
  }

  @Post(':id/approve')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.ATTENDANCE_VERIFY)
  @CacheInvalidateExtra(['attendance-corrections', 'attendance'])
  async approve(
    @Param('id') id: string,
    @Body() body: { notes?: string },
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.approve(id, employeeId!, companyId, body.notes);
  }

  @Post(':id/reject')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.ATTENDANCE_VERIFY)
  async reject(
    @Param('id') id: string,
    @Body() body: { notes?: string },
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.reject(id, employeeId!, companyId, body.notes);
  }
}
