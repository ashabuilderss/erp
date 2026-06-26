import { Controller, Sse, MessageEvent, Req } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { EventsService } from './events.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';

@Controller('events')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Sse('stream')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  stream(@Req() req: Request): Observable<MessageEvent> {
    const companyId =
      (req as unknown as { user: { companyId: string } }).user?.companyId ||
      'default';
    return this.eventsService
      .subscribe(companyId)
      .pipe(map((data) => ({ data: JSON.stringify(data) })));
  }
}
