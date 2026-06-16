import { Controller, Get, Query } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';
import { QueryActivityLogDto } from './dto/query-activity-log.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentCompany } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('activity-logs')
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async findAll(
    @Query() query: QueryActivityLogDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.activityLogsService.findAll(query, companyId);
  }
}
