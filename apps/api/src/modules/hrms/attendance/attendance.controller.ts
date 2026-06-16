import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Sse,
  MessageEvent,
  Req,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  CurrentCompany,
  CurrentEmployeeId,
} from '../../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';
import { Observable, map } from 'rxjs';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Sse('events')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  events(@Req() req: Request): Observable<MessageEvent> {
    const companyId = (req as unknown as { user: { companyId: string } }).user
      .companyId;
    return this.attendanceService
      .subscribe(companyId)
      .pipe(map((data) => ({ data: JSON.stringify(data) })));
  }

  @Get('me')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  async getMyAttendance(
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.attendanceService.getMyAttendance(employeeId!, companyId);
  }

  @Post('me/check-in')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  async checkIn(
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.attendanceService.checkIn(employeeId!, companyId);
  }

  @Post('me/check-out')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  async checkOut(@CurrentEmployeeId() employeeId: string | null) {
    return this.attendanceService.checkOut(employeeId!);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async create(
    @Body() dto: CreateAttendanceDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.attendanceService.create(dto, companyId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async findAll(
    @Query() query: QueryAttendanceDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.attendanceService.findAll(query, companyId);
  }

  @Get('today')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async getToday(@CurrentCompany('id') companyId: string) {
    return this.attendanceService.getTodayAttendance(companyId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async findOne(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.attendanceService.findOne(id, companyId);
  }

  @Post(':id/verify')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async verify(
    @Param('id') id: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.attendanceService.verify(id, employeeId!, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAttendanceDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.attendanceService.update(id, dto, companyId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.attendanceService.remove(id, companyId);
  }
}
