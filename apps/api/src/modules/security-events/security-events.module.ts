import { Module } from '@nestjs/common';
import { SecurityEventsService } from './security-events.service';
import { SecurityEventsController } from './security-events.controller';
import { SecurityEventListener } from './security-event-listener';

@Module({
  controllers: [SecurityEventsController],
  providers: [SecurityEventsService, SecurityEventListener],
})
export class SecurityEventsModule {}
