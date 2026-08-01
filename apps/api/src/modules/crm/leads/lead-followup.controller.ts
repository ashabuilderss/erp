import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { LeadFollowUpService } from './lead-followup.service';
import { CreateLeadFollowUpDto } from './dto/create-lead-followup.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser, CurrentEmployeeId } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { Permissions } from '../../../common/auth/permissions';
import { UseIdempotency } from '../../../common/decorators/idempotency.decorator';

@Controller('leads/:leadId/follow-ups')
export class LeadFollowUpController {
  constructor(private readonly followUpService: LeadFollowUpService) {}

  @Post()
  @UseIdempotency()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.FIELD_EMPLOYEE, UserRole.MANAGER)
  @RequirePermissions(Permissions.LEAD_UPDATE)
  async create(
    @Param('leadId') leadId: string,
    @CurrentUser('companyId') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
    @Body() dto: CreateLeadFollowUpDto,
  ) {
    return this.followUpService.logFollowUp(leadId, companyId, employeeId!, dto);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.FIELD_EMPLOYEE, UserRole.MANAGER)
  @RequirePermissions(Permissions.LEAD_READ)
  async findAll(
    @Param('leadId') leadId: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.followUpService.getFollowUps(leadId, companyId);
  }
}
