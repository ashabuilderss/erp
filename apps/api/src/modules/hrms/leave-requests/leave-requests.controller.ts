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
import { LeaveRequestsService } from './leave-requests.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { ApproveLeaveRequestDto } from './dto/approve-leave-request.dto';
import { QueryLeaveRequestDto } from './dto/query-leave-request.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { Permissions } from '../../../common/auth/permissions';
import { UserRole } from '@prisma/client';
import { CacheInvalidateExtra } from '../../../common/decorators/cache.decorators';
import {
  CurrentUser,
  CurrentCompany,
  CurrentEmployeeId,
} from '../../../common/decorators/current-user.decorator';
import { UseIdempotency } from '../../../common/decorators/idempotency.decorator';
import { getScopedEmployeeId } from '../../../common/utils/role-scope.util';

@Controller('leave-requests')
export class LeaveRequestsController {
  constructor(private readonly leaveRequestsService: LeaveRequestsService) {}

  @Get('me')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.TEAM_LEAD, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.LEAVE_READ)
  async getMyLeaveRequests(
    @Query() query: QueryLeaveRequestDto,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.leaveRequestsService.findAll(query, companyId, employeeId!);
  }

  @Post('me')
  @UseIdempotency()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.TEAM_LEAD, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.LEAVE_CREATE)
  async createMyLeaveRequest(
    @Body() dto: CreateLeaveRequestDto,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.leaveRequestsService.createMyLeaveRequest(
      dto,
      employeeId!,
      companyId,
    );
  }

  @Post()
  @UseIdempotency()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.TEAM_LEAD, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.LEAVE_CREATE)
  async create(
    @Body() dto: CreateLeaveRequestDto,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentUser('role') role: string,
  ) {
    return this.leaveRequestsService.create(
      dto,
      companyId,
      getScopedEmployeeId(role, employeeId),
    );
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.TEAM_LEAD, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.LEAVE_READ)
  async findAll(
    @Query() query: QueryLeaveRequestDto,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentUser('role') role: string,
  ) {
    return this.leaveRequestsService.findAll(
      query,
      companyId,
      getScopedEmployeeId(role, employeeId),
    );
  }

  @Get('pending-count')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.TEAM_LEAD, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.LEAVE_READ)
  async getPendingCount(
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentUser('role') role: string,
  ) {
    return this.leaveRequestsService.getPendingCount(
      companyId,
      getScopedEmployeeId(role, employeeId),
    );
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.TEAM_LEAD, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.LEAVE_READ)
  async findOne(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentUser('role') role: string,
  ) {
    const owningEmployeeId = getScopedEmployeeId(role, employeeId);
    return this.leaveRequestsService.findOne(id, companyId, owningEmployeeId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.TEAM_LEAD, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.LEAVE_CREATE)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLeaveRequestDto,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentUser('role') role: string,
  ) {
    return this.leaveRequestsService.update(
      id,
      dto,
      companyId,
      getScopedEmployeeId(role, employeeId),
    );
  }

  @Patch(':id/approve')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.LEAVE_APPROVE)
  @CacheInvalidateExtra(['leave-requests', 'leave-allocations'])
  async approve(
    @Param('id') id: string,
    @Body() dto: ApproveLeaveRequestDto,
    @CurrentUser('id') userId: string,
    @CurrentCompany('id') companyId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.leaveRequestsService.approve(
      id,
      dto,
      userId,
      companyId,
      userRole,
    );
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.LEAVE_APPROVE)
  async remove(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.leaveRequestsService.remove(id, companyId);
  }
}
