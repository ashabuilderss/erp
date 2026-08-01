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
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permissions } from '../../common/auth/permissions';
import { UserRole } from '@prisma/client';
import { HoldActivationListener } from './hold-activation.listener';
import { HoldReleaseService } from './hold-release.service';
import {
  CreateEmergencyHoldDto,
  ReleaseHoldDto,
} from './dto/payroll-holds.dto';
import { PrismaService } from '../../config/prisma.service';
import { UseIdempotency } from '../../common/decorators/idempotency.decorator';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';

@Controller('payroll-holds')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
export class PayrollHoldsController {
  constructor(
    private readonly activationListener: HoldActivationListener,
    private readonly releaseService: HoldReleaseService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('emergency')
  @UseIdempotency()
  @Roles(UserRole.OWNER)
  @RequirePermissions(Permissions.PAYROLL_HOLD_CREATE)
  async createEmergencyHold(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateEmergencyHoldDto,
  ) {
    return await this.activationListener.createEmergencyHold(
      req.user.companyId,
      req.user.id,
      dto,
    );
  }

  @Post(':id/release-request')
  @UseIdempotency()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.PAYROLL_HOLD_RELEASE)
  async requestRelease(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: ReleaseHoldDto,
  ) {
    return await this.releaseService.requestRelease(
      req.user.companyId,
      id,
      req.user.id,
      dto,
    );
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.PAYROLL_READ)
  async getHolds(
    @Request() req: AuthenticatedRequest,
    @Query('employeeId') employeeId?: string,
  ) {
    return await this.prisma.payrollHold.findMany({
      where: {
        companyId: req.user.companyId,
        ...(employeeId ? { employeeId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.PAYROLL_READ)
  async getHoldDetails(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return await this.prisma.payrollHold.findFirst({
      where: { id, companyId: req.user.companyId },
      include: { payrollHoldHistories: { orderBy: { createdAt: 'asc' } } },
    });
  }
}
