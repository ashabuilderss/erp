import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Sse,
  MessageEvent,
  Req,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { Request } from 'express';
import { Observable, map } from 'rxjs';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(
    @Query() query: QueryNotificationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.findAll(query, userId);
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser('id') userId: string) {
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Patch('read-all')
  async markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Sse('stream')
  stream(@Req() req: Request): Observable<MessageEvent> {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.notificationsService
      .subscribe(userId)
      .pipe(map((data) => ({ data: JSON.stringify(data) })));
  }
}
