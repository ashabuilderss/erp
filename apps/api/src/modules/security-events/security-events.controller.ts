import { Controller, Get, Query } from '@nestjs/common';
import { SecurityEventsService } from './security-events.service';
import { QuerySecurityEventDto } from './dto/query-security-event.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentCompany } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller()
export class SecurityEventsController {
  constructor(private readonly securityEventsService: SecurityEventsService) {}

  @Get('security-events')
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query() query: QuerySecurityEventDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.securityEventsService.findAll(query, companyId);
  }

  @Get('login-history')
  @Roles(UserRole.ADMIN)
  async findLoginHistory(@CurrentCompany('id') companyId: string) {
    return this.securityEventsService.findLoginHistory(companyId);
  }

  @Get('sessions')
  @Roles(UserRole.ADMIN)
  async findSessions(@CurrentCompany('id') companyId: string) {
    return this.securityEventsService.findSessions(companyId);
  }
}
