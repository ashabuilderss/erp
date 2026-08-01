import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import {
  CreateMeetingDto,
  UpdateMeetingDto,
  AddAttendeeDto,
  CreateMinutesDto,
  QueryMeetingDto,
} from './dto/create-meeting.dto';
import {
  CreateActionItemDto,
  UpdateActionItemDto,
} from './dto/create-action-item.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permissions } from '../../common/auth/permissions';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { UseIdempotency } from '../../common/decorators/idempotency.decorator';

@Controller('meetings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MeetingsController {
  constructor(private readonly service: MeetingsService) {}

  // ─── LIST / CREATE ────────────────────────────────────────────────

  @Get()
  @Roles(
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
  )
  @RequirePermissions(Permissions.MEETING_READ)
  async findAll(
    @CurrentUser('companyId') companyId: string,
    @Query() query: QueryMeetingDto,
  ) {
    return this.service.findAll(companyId, query);
  }

  @Post()
  @UseIdempotency()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.MEETING_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateMeetingDto,
  ) {
    return this.service.create(companyId, dto, userId);
  }

  // ─── SINGLE MEETING ───────────────────────────────────────────────

  @Get(':id')
  @Roles(
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
  )
  @RequirePermissions(Permissions.MEETING_READ)
  async findOne(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.service.findOne(companyId, id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.MEETING_CREATE)
  async update(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMeetingDto,
  ) {
    return this.service.update(companyId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.MEETING_CREATE)
  async remove(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.service.remove(companyId, id);
  }

  // ─── STATUS CHANGES ───────────────────────────────────────────────

  @Post(':id/complete')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.MEETING_RECORD_MOM)
  async complete(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.service.complete(companyId, id);
  }

  @Post(':id/cancel')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.MEETING_CREATE)
  async cancel(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.service.cancel(companyId, id);
  }

  // ─── ATTENDEES ────────────────────────────────────────────────────

  @Post(':id/attendees')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.MEETING_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async addAttendee(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: AddAttendeeDto,
  ) {
    return this.service.addAttendee(companyId, id, dto);
  }

  @Delete(':id/attendees/:employeeId')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.MEETING_CREATE)
  async removeAttendee(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Param('employeeId') employeeId: string,
  ) {
    return this.service.removeAttendee(companyId, id, employeeId);
  }

  @Patch(':id/attendees/:employeeId')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.MEETING_RECORD_MOM)
  async markAttendance(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Param('employeeId') employeeId: string,
    @Body() body: { attended?: boolean },
  ) {
    return this.service.markAttendance(
      companyId,
      id,
      employeeId,
      body.attended ?? true,
    );
  }

  // ─── MINUTES ──────────────────────────────────────────────────────

  @Post(':id/minutes')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.MEETING_RECORD_MOM)
  @HttpCode(HttpStatus.CREATED)
  async addMinutes(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: CreateMinutesDto,
  ) {
    return this.service.addMinutes(companyId, id, {
      ...dto,
      recordedById: dto.recordedById || userId,
    });
  }

  @Get(':id/minutes')
  @Roles(
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
  )
  @RequirePermissions(Permissions.MEETING_READ)
  async listMinutes(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.service.listMinutes(companyId, id);
  }

  // ─── ACTION ITEMS ─────────────────────────────────────────────────

  @Post(':id/action-items')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.MEETING_RECORD_MOM)
  @HttpCode(HttpStatus.CREATED)
  async createActionItem(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: CreateActionItemDto,
  ) {
    return this.service.createActionItem(companyId, id, dto);
  }

  @Patch('action-items/:itemId')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.MEETING_RECORD_MOM)
  async updateActionItem(
    @CurrentUser('companyId') companyId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateActionItemDto,
  ) {
    return this.service.updateActionItem(companyId, itemId, dto);
  }

  @Get(':id/action-items')
  @Roles(
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
  )
  @RequirePermissions(Permissions.MEETING_READ)
  async listActionItems(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.service.listActionItems(companyId, id);
  }
}
