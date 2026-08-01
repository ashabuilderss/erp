import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permissions } from '../../common/auth/permissions';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @RequirePermissions(Permissions.NOTIFICATION_READ)
  async findAll(
    @Query() query: QueryNotificationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.findAll(query, userId);
  }

  @Get('unread-count')
  @RequirePermissions(Permissions.NOTIFICATION_READ)
  async getUnreadCount(@CurrentUser('id') userId: string) {
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Get('unacknowledged-count')
  @RequirePermissions(Permissions.NOTIFICATION_READ)
  async getUnacknowledgedCount(@CurrentUser('id') userId: string) {
    const count = await this.notificationsService.getUnacknowledgedCount(userId);
    return { count };
  }

  @Patch(':id/read')
  @RequirePermissions(Permissions.NOTIFICATION_READ)
  async markAsRead(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Patch(':id/acknowledge')
  @RequirePermissions(Permissions.NOTIFICATION_READ)
  async acknowledge(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.notificationsService.acknowledge(id, userId);
  }

  @Patch('read-all')
  @RequirePermissions(Permissions.NOTIFICATION_READ)
  async markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }
}
