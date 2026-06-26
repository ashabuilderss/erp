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
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { Permissions } from '../../../common/auth/permissions';
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
  @RequirePermissions(Permissions.ATTENDANCE_READ)
  events(@Req() req: Request): Observable<MessageEvent> {
    const companyId = (req as unknown as { user: { companyId: string } }).user
      .companyId;
    return this.attendanceService
      .subscribe(companyId)
      .pipe(map((data) => ({ data: JSON.stringify(data) })));
  }

  @Get('me')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.ATTENDANCE_READ)
  async getMyAttendance(
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.attendanceService.getMyAttendance(employeeId!, companyId);
  }

  @Post('me/check-in')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.ATTENDANCE_CREATE)
  async checkIn(
    @Body()
    body: { latitude?: number; longitude?: number; checkInPhoto?: string },
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentCompany('id') companyId: string,
    @Req() req: Request,
  ) {
    const ipAddress =
      (req.headers['x-forwarded-for'] as string | undefined)
        ?.split(',')[0]
        ?.trim() ?? req.socket.remoteAddress;
    const trustedProxy = process.env.TRUST_PROXY === 'true';
    return this.attendanceService.checkIn(employeeId!, companyId, {
      latitude: body.latitude,
      longitude: body.longitude,
      checkInPhoto: body.checkInPhoto,
      ipAddress: trustedProxy
        ? (req.headers['x-forwarded-for'] as string | undefined)
            ?.split(',')[0]
            ?.trim()
        : undefined,
    });
  }

  @Post('me/check-out')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.ATTENDANCE_CREATE)
  async checkOut(
    @Body()
    body: { latitude?: number; longitude?: number; checkOutPhoto?: string },
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.attendanceService.checkOut(employeeId!, companyId, {
      latitude: body.latitude,
      longitude: body.longitude,
      checkOutPhoto: body.checkOutPhoto,
    });
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.ATTENDANCE_CREATE)
  async create(
    @Body() dto: CreateAttendanceDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.attendanceService.create(dto, companyId);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.ATTENDANCE_READ)
  async findAll(
    @Query() query: QueryAttendanceDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.attendanceService.findAll(query, companyId);
  }

  @Get('today')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.ATTENDANCE_READ)
  async getToday(@CurrentCompany('id') companyId: string) {
    return this.attendanceService.getTodayAttendance(companyId);
  }

  @Get('last-7-days')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.OWNER)
  @RequirePermissions(Permissions.ATTENDANCE_READ)
  async getLast7Days(@CurrentCompany('id') companyId: string) {
    return this.attendanceService.getLast7Days(companyId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.ATTENDANCE_READ)
  async findOne(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.attendanceService.findOne(id, companyId);
  }

  @Post(':id/verify')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.ATTENDANCE_VERIFY)
  async verify(
    @Param('id') id: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.attendanceService.verify(id, employeeId!, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.ATTENDANCE_CREATE)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAttendanceDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.attendanceService.update(id, dto, companyId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @RequirePermissions(Permissions.ATTENDANCE_VERIFY)
  async remove(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.attendanceService.remove(id, companyId);
  }
}
