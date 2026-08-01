import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permissions } from '../../common/auth/permissions';
import { TasksService } from './tasks.service';
import { TaskProofService } from './task-proof.service';
import { TaskExtensionService } from './task-extension.service';
import {
  CreateTaskDto,
  ReassignTaskDto,
  SubmitProofDto,
  ReviewProofDto,
  CreateExtensionDto,
} from './dto/tasks.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';
import { UseIdempotency } from '../../common/decorators/idempotency.decorator';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly proofService: TaskProofService,
    private readonly extensionService: TaskExtensionService,
  ) {}

  @Post()
  @UseIdempotency()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_LEAD)
  @RequirePermissions(Permissions.TASK_ASSIGN)
  async createTask(@Request() req: AuthenticatedRequest, @Body() dto: CreateTaskDto) {
    const isOwner = req.user.role === 'OWNER';
    return await this.tasksService.createTask(
      req.user.companyId,
      req.user.id,
      dto,
      isOwner,
    );
  }

  @Get()
  @RequirePermissions(Permissions.TASK_ASSIGN)
  async findAll(@Request() req: AuthenticatedRequest, @Query() query: QueryTaskDto) {
    return await this.tasksService.findAll(req.user.companyId, query);
  }

  @Get('me')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.FIELD_EMPLOYEE, UserRole.MANAGER, UserRole.TEAM_LEAD, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.TASK_ASSIGN)
  async findMyTasks(@Request() req: AuthenticatedRequest, @Query() query: QueryTaskDto) {
    return await this.tasksService.findMyTasks(
      req.user.companyId,
      req.user.id,
      query,
    );
  }

  @Get(':id')
  @RequirePermissions(Permissions.TASK_ASSIGN)
  async findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return await this.tasksService.findOne(req.user.companyId, id);
  }

  @Post(':id/reassign')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_LEAD)
  @RequirePermissions(Permissions.TASK_ASSIGN)
  async reassignTask(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: ReassignTaskDto,
  ) {
    return await this.tasksService.reassignTask(
      req.user.companyId,
      id,
      req.user.id,
      dto,
    );
  }

  @Post(':id/cancel')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_LEAD)
  @RequirePermissions(Permissions.TASK_ASSIGN)
  async cancelTask(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return await this.tasksService.cancelTask(
      req.user.companyId,
      id,
      req.user.id,
    );
  }

  @Post(':id/acknowledge')
  @Roles(UserRole.EMPLOYEE, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.TASK_ASSIGN)
  async acknowledgeTask(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return await this.tasksService.acknowledgeTask(
      req.user.companyId,
      id,
      req.user.id,
    );
  }

  @Post(':id/proof')
  @Roles(UserRole.EMPLOYEE, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.TASK_ASSIGN)
  async submitProof(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: SubmitProofDto,
  ) {
    return await this.proofService.submitProof(
      req.user.companyId,
      id,
      req.user.id,
      dto,
    );
  }

  @Post('proofs/:proofId/acknowledge')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_LEAD, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.TASK_COMPLETION_ACKNOWLEDGE)
  async acknowledgeCompletion(
    @Param('proofId') proofId: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: ReviewProofDto,
  ) {
    return await this.proofService.acknowledgeCompletion(
      req.user.companyId,
      proofId,
      req.user.id,
      dto,
    );
  }

  @Post('proofs/:proofId/approve')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.TASK_COMPLETION_APPROVE)
  async approveCompletion(
    @Param('proofId') proofId: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: ReviewProofDto,
  ) {
    return await this.proofService.approveCompletion(
      req.user.companyId,
      proofId,
      req.user.id,
      dto,
    );
  }

  @Post('proofs/:proofId/reject')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_LEAD, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.TASK_COMPLETION_ACKNOWLEDGE)
  async rejectCompletion(
    @Param('proofId') proofId: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: ReviewProofDto,
  ) {
    return await this.proofService.rejectCompletion(
      req.user.companyId,
      proofId,
      req.user.id,
      dto,
    );
  }

  @Post(':id/extensions')
  @Roles(UserRole.EMPLOYEE, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.TASK_ASSIGN)
  async requestExtension(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateExtensionDto,
  ) {
    return await this.extensionService.requestExtension(
      req.user.companyId,
      id,
      req.user.id,
      dto,
    );
  }
}
