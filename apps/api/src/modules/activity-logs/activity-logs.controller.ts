import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ActivityLogsService } from './activity-logs.service';
import { QueryActivityLogDto } from './dto/query-activity-log.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permissions } from '../../common/auth/permissions';
import { CurrentCompany } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('activity-logs')
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.AUDIT_LOG_READ)
  async findAll(
    @Query() query: QueryActivityLogDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.activityLogsService.findAll(query, companyId);
  }

  @Get('export')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.AUDIT_LOG_READ)
  async export(
    @Query() query: QueryActivityLogDto,
    @CurrentCompany('id') companyId: string,
    @Res() res: Response,
  ) {
    const format = query.format || 'csv';
    const data = await this.activityLogsService.exportAll(query, companyId);

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="activity-logs.json"',
      );
      return res.json(data);
    }

    const header = 'Time,Action,Entity,Entity ID,Description,Performed By,Actor Email,Actor Role,IP Address,Request ID';
    const rows = data.map((log) => {
      const performedByName = log.performedBy?.user
        ? `${log.performedBy.user.firstName} ${log.performedBy.user.lastName}`
        : log.performedBy?.employeeCode || '';
      return [
        log.createdAt.toISOString(),
        `"${log.action.replace(/"/g, '""')}"`,
        log.entityType,
        log.entityId,
        `"${(log.description || '').replace(/"/g, '""')}"`,
        `"${performedByName.replace(/"/g, '""')}"`,
        `"${(log.actorEmail || '').replace(/"/g, '""')}"`,
        `"${(log.actorRole || '').replace(/"/g, '""')}"`,
        `"${(log.ipAddress || '').replace(/"/g, '""')}"`,
        `"${(log.requestId || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="activity-logs.csv"',
    );
    return res.send([header, ...rows].join('\n'));
  }
}
