import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { EscalationEventsService } from './escalation-events.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentCompany } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('escalation-events')
export class EscalationEventsController {
  constructor(private readonly service: EscalationEventsService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async findAll(
    @Query('status') status: string | undefined,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findAll(companyId, status);
  }

  @Patch(':id/resolve')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async resolve(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.resolve(id, companyId);
  }
}
