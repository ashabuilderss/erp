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
import { LeaveAllocationsService } from './leave-allocations.service';
import { CreateLeaveAllocationDto } from './dto/create-leave-allocation.dto';
import { UpdateLeaveAllocationDto } from './dto/update-leave-allocation.dto';
import { QueryLeaveAllocationDto } from './dto/query-leave-allocation.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { Permissions } from '../../../common/auth/permissions';
import {
  CurrentCompany,
  CurrentEmployeeId,
} from '../../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('leave-allocations')
export class LeaveAllocationsController {
  constructor(private readonly service: LeaveAllocationsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.LEAVE_CREATE)
  async create(
    @Body() dto: CreateLeaveAllocationDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.create(dto, companyId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.LEAVE_READ)
  async findAll(
    @Query() query: QueryLeaveAllocationDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findAll(query, companyId);
  }

  @Get('my-balance')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.LEAVE_READ)
  async myBalance(
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findEmployeeBalance(employeeId!, companyId);
  }

  @Get('employee/:employeeId')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.LEAVE_READ)
  async employeeBalance(
    @Param('employeeId') employeeId: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findEmployeeBalance(employeeId, companyId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.LEAVE_READ)
  async findOne(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.LEAVE_CREATE)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLeaveAllocationDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.update(id, dto, companyId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @RequirePermissions(Permissions.LEAVE_APPROVE)
  async remove(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.remove(id, companyId);
  }
}
