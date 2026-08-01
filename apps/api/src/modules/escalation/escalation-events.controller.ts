import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { EscalationEventsService } from './escalation-events.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permissions } from '../../common/auth/permissions';
import { CurrentCompany } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('escalation-events')
export class EscalationEventsController {
  constructor(private readonly service: EscalationEventsService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_LEAD)
  @RequirePermissions(Permissions.ESCALATION_READ)
  async findAll(
    @Query('status') status: string | undefined,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findAll(companyId, status);
  }

  @Patch(':id/resolve')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_LEAD)
  @RequirePermissions(Permissions.ESCALATION_CREATE)
  async resolve(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.resolve(id, companyId);
  }
}
