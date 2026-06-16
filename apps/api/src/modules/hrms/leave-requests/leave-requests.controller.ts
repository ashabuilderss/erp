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
import { UserRole } from '@prisma/client';
import {
  CurrentUser,
  CurrentCompany,
  CurrentEmployeeId,
} from '../../../common/decorators/current-user.decorator';

@Controller('leave-requests')
export class LeaveRequestsController {
  constructor(private readonly leaveRequestsService: LeaveRequestsService) {}

  @Get('me')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  async getMyLeaveRequests(
    @Query() query: QueryLeaveRequestDto,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.leaveRequestsService.findAll(query, companyId, employeeId!);
  }

  @Post('me')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
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
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  async create(
    @Body() dto: CreateLeaveRequestDto,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentUser('role') role: string,
  ) {
    return this.leaveRequestsService.create(
      dto,
      companyId,
      role === 'EMPLOYEE' ? employeeId! : undefined,
    );
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  async findAll(
    @Query() query: QueryLeaveRequestDto,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentUser('role') role: string,
  ) {
    return this.leaveRequestsService.findAll(
      query,
      companyId,
      role === 'EMPLOYEE' ? employeeId! : undefined,
    );
  }

  @Get('pending-count')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async getPendingCount(@CurrentCompany('id') companyId: string) {
    return this.leaveRequestsService.getPendingCount(companyId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  async findOne(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentUser('role') role: string,
  ) {
    const owningEmployeeId = role === 'EMPLOYEE' ? employeeId! : undefined;
    return this.leaveRequestsService.findOne(id, companyId, owningEmployeeId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
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
      role === 'EMPLOYEE' ? employeeId! : undefined,
    );
  }

  @Patch(':id/approve')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async approve(
    @Param('id') id: string,
    @Body() dto: ApproveLeaveRequestDto,
    @CurrentUser('id') userId: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.leaveRequestsService.approve(id, dto, userId, companyId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.leaveRequestsService.remove(id, companyId);
  }
}
