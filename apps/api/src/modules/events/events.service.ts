import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RealtimeGateway } from '../../common/realtime/realtime.gateway';

interface ChangeEvent {
  companyId: string;
  entityId?: string;
  action: string;
}

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(private readonly realtimeGateway: RealtimeGateway) {}

  push(
    companyId: string,
    event: string,
    entityType: string,
    payload?: unknown,
  ) {
    this.realtimeGateway.broadcastToCompany(companyId, event, {
      event,
      entityType,
      ...(payload ? { payload } : {}),
    });
  }

  @OnEvent('*.created')
  handleCreate(payload: ChangeEvent) {
    this.push(payload.companyId, 'created', '');
  }

  @OnEvent('*.updated')
  handleUpdate(payload: ChangeEvent) {
    this.push(payload.companyId, 'updated', '');
  }

  @OnEvent('*.deleted')
  handleDelete(payload: ChangeEvent) {
    this.push(payload.companyId, 'deleted', '');
  }
}
