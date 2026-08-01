import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { TaskCommentsService } from './task-comments.service';
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { Permissions } from '../../../common/auth/permissions';
import {
  CurrentCompany,
  CurrentEmployeeId,
  CurrentUser,
} from '../../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { UseIdempotency } from '../../../common/decorators/idempotency.decorator';

@Controller('task-comments')
export class TaskCommentsController {
  constructor(private readonly taskCommentsService: TaskCommentsService) {}

  @Get('assignment/:assignmentId')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.EMS_READ)
  async findByAssignment(
    @Param('assignmentId') assignmentId: string,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentUser('role') role: string,
  ) {
    return this.taskCommentsService.findByAssignment(
      assignmentId,
      companyId,
      employeeId!,
      role,
    );
  }

  @Post()
  @UseIdempotency()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.EMS_CREATE)
  async create(
    @Body() dto: CreateTaskCommentDto,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
  ) {
    return this.taskCommentsService.create(dto, companyId, employeeId!);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.EMS_CREATE)
  async remove(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentUser('role') role: string,
  ) {
    return this.taskCommentsService.remove(id, companyId, employeeId!, role);
  }
}
