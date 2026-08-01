import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApprovalsRuntimeService } from './approvals-runtime.service';
import { ApprovalsSpawningService } from './approvals-spawning.service';
import {
  ActionApprovalDto,
  OverrideApprovalDto,
  CreateApprovalTemplateDto,
} from './dto/approvals.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permissions } from '../../common/auth/permissions';
import { PrismaService } from '../../config/prisma.service';
import { ApprovalStatus, UserRole } from '@prisma/client';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';

@Controller('approvals')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.OWNER, UserRole.ADMIN)
export class ApprovalsController {
  constructor(
    private readonly runtimeService: ApprovalsRuntimeService,
    private readonly spawningService: ApprovalsSpawningService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('pending')
  @RequirePermissions(Permissions.APPROVAL_READ)
  async getPendingApprovals(@Request() req: AuthenticatedRequest) {
    const userId = req.user.id;
    const companyId = req.user.companyId;

    // Resolve user's employee ID
    const employee = await this.prisma.employee.findFirst({
      where: { userId },
    });

    // Find all delegators mapping to this user
    let delegatorUserIds: string[] = [];
    if (employee) {
      const now = new Date();
      const delegations = await this.prisma.delegation.findMany({
        where: {
          delegateId: employee.id,
          isActive: true,
          validFrom: { lte: now },
          validTo: { gte: now },
        },
        include: { employeesDelegationsDelegatorIdToemployees: true },
      });
      delegatorUserIds = delegations
        .map((d) => d.employeesDelegationsDelegatorIdToemployees.userId)
        .filter((id) => id !== null);
    }

    const targetUserIds = [userId, ...delegatorUserIds];

    return await this.prisma.approvalRequest.findMany({
      where: {
        companyId,
        status: { in: [ApprovalStatus.PENDING, ApprovalStatus.ESCALATED] },
        approvalSteps: {
          some: {
            status: ApprovalStatus.PENDING,
            requiredUserId: { in: targetUserIds },
          },
        },
      },
      include: {
        approvalSteps: {
          where: { status: ApprovalStatus.PENDING },
        },
      },
    });
  }

  @Post('templates')
  @RequirePermissions(Permissions.APPROVAL_MANAGE)
  async createTemplate(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateApprovalTemplateDto,
  ) {
    // In reality this would be protected by PermissionsGuard
    return await this.prisma.approvalTemplate.create({
      data: {
        companyId: req.user.companyId,
        entityType: dto.entityType,
        description: dto.description,
        approvalTemplateSteps: {
          create: dto.steps.map((s, index) => ({
            companyId: req.user.companyId,
            sequence: index + 1,
            requiredRoleId: s.requiredRoleId,
            requiredUserId: s.requiredUserId,
            isDirectManager: s.isDirectManager || false,
            slaHours: s.slaHours || 24,
          })),
        },
      },
    });
  }

  @Post(':id/approve')
  @RequirePermissions(Permissions.APPROVAL_MANAGE)
  async approve(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: ActionApprovalDto,
  ) {
    return await this.runtimeService.approveStep(id, req.user.id, dto.comments);
  }

  @Post(':id/reject')
  @RequirePermissions(Permissions.APPROVAL_MANAGE)
  async reject(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: ActionApprovalDto,
  ) {
    return await this.runtimeService.rejectStep(id, req.user.id, dto.comments);
  }

  @Post(':id/override')
  @Roles(UserRole.OWNER)
  @RequirePermissions(Permissions.APPROVAL_MANAGE)
  async override(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: OverrideApprovalDto,
  ) {
    // Rbac check for OWNER should be enforced via guards. Relying on service internal logic for now.
    return await this.runtimeService.overrideRequest(
      id,
      req.user.id,
      dto.reason,
    );
  }
}
