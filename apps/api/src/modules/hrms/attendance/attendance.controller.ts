import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { Permissions } from '../../../common/auth/permissions';
import {
  CurrentCompany,
  CurrentEmployeeId,
} from '../../../common/decorators/current-user.decorator';
import { UserRole, PunchType } from '@prisma/client';
import { AuthenticatedRequest } from '../../../common/interfaces/request.interface';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { CheckInDto, CheckOutDto, PunchDto } from './dto/punch.dto';
import { UseIdempotency } from '../../../common/decorators/idempotency.decorator';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.ATTENDANCE_READ)
  async findAll(
    @CurrentCompany('id') companyId: string,
    @Query() query: QueryAttendanceDto,
  ) {
    return this.attendanceService.findAll(companyId, query);
  }

  @Get('today')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.ATTENDANCE_READ)
  async getTodayStats(@CurrentCompany('id') companyId: string) {
    return this.attendanceService.getTodayStats(companyId);
  }

  @Get('last-7-days')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.ATTENDANCE_READ)
  async getLast7Days(@CurrentCompany('id') companyId: string) {
    return this.attendanceService.getLast7Days(companyId);
  }

  @Get('me')
  @Roles(
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.EMPLOYEE,
    UserRole.FIELD_EMPLOYEE,
  )
  @RequirePermissions(Permissions.ATTENDANCE_READ)
  async getMyAttendance(
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentCompany('id') companyId: string,
  ) {
    if (!employeeId) {
      throw new BadRequestException(
        'No employee record linked to your account',
      );
    }
    return this.attendanceService.getMyAttendance(employeeId, companyId);
  }

  @Get('nonce/generate')
  @Roles(
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.EMPLOYEE,
    UserRole.FIELD_EMPLOYEE,
  )
  @RequirePermissions(Permissions.ATTENDANCE_CREATE)
  async getNonce(
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentCompany('id') companyId: string,
  ) {
    if (!employeeId) {
      throw new BadRequestException(
        'No employee record linked to your account',
      );
    }
    return this.attendanceService.generateNonce(employeeId, companyId);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.ATTENDANCE_READ)
  async findOne(
    @CurrentCompany('id') companyId: string,
    @Param('id') id: string,
  ) {
    return this.attendanceService.findOne(companyId, id);
  }

  @Post()
  @UseIdempotency()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.ATTENDANCE_CREATE)
  async createManual(
    @CurrentCompany('id') companyId: string,
    @Body() dto: CreateAttendanceDto,
  ) {
    return this.attendanceService.createManual(companyId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.ATTENDANCE_VERIFY)
  async update(
    @CurrentCompany('id') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAttendanceDto,
  ) {
    return this.attendanceService.update(companyId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.ATTENDANCE_VERIFY)
  async remove(
    @CurrentCompany('id') companyId: string,
    @Param('id') id: string,
  ) {
    return this.attendanceService.remove(companyId, id);
  }

  @Post('me/check-in')
  @UseIdempotency()
  @Roles(
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.EMPLOYEE,
    UserRole.FIELD_EMPLOYEE,
  )
  @RequirePermissions(Permissions.ATTENDANCE_CREATE)
  async checkIn(
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentCompany('id') companyId: string,
    @Body() body: CheckInDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!employeeId) {
      throw new BadRequestException(
        'No employee record linked to your account',
      );
    }
    const ipAddress =
      (req.headers['x-forwarded-for'] as string | undefined)
        ?.split(',')[0]
        ?.trim() ?? req.socket.remoteAddress;
    return this.attendanceService.punch(
      employeeId,
      companyId,
      {
        punchType: 'IN',
        latitude: body.latitude,
        longitude: body.longitude,
        photoUrl: body.checkInPhoto,
        nonce: body.nonce,
      },
      ipAddress,
    );
  }

  @Post('me/check-out')
  @UseIdempotency()
  @Roles(
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.EMPLOYEE,
    UserRole.FIELD_EMPLOYEE,
  )
  @RequirePermissions(Permissions.ATTENDANCE_CREATE)
  async checkOut(
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentCompany('id') companyId: string,
    @Body() body: CheckOutDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!employeeId) {
      throw new BadRequestException(
        'No employee record linked to your account',
      );
    }
    const ipAddress =
      (req.headers['x-forwarded-for'] as string | undefined)
        ?.split(',')[0]
        ?.trim() ?? req.socket.remoteAddress;
    return this.attendanceService.punch(
      employeeId,
      companyId,
      {
        punchType: 'OUT',
        latitude: body.latitude,
        longitude: body.longitude,
        photoUrl: body.checkOutPhoto,
        nonce: body.nonce,
      },
      ipAddress,
    );
  }

  @Post(':id/verify')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.ATTENDANCE_VERIFY)
  async verify(
    @CurrentCompany('id') companyId: string,
    @Param('id') id: string,
  ) {
    return this.attendanceService.verify(companyId, id);
  }

  @Post('punch')
  @UseIdempotency()
  @Roles(
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.EMPLOYEE,
    UserRole.FIELD_EMPLOYEE,
  )
  @RequirePermissions(Permissions.ATTENDANCE_CREATE)
  async punch(
    @Body() body: PunchDto,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentCompany('id') companyId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!employeeId) {
      throw new BadRequestException(
        'No employee record linked to your account',
      );
    }
    const ipAddress =
      (req.headers['x-forwarded-for'] as string | undefined)
        ?.split(',')[0]
        ?.trim() ?? req.socket.remoteAddress;
    return this.attendanceService.punch(employeeId, companyId, body, ipAddress);
  }
}
