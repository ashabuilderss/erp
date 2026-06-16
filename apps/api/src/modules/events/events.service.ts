import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Subject } from 'rxjs';

interface ChangeEvent {
  companyId: string;
  entityId?: string;
  action: string;
}

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  private companySubjects = new Map<string, Subject<unknown>>();

  subscribe(companyId: string): Subject<unknown> {
    if (!this.companySubjects.has(companyId)) {
      this.companySubjects.set(companyId, new Subject<unknown>());
      this.logger.log(`SSE subscription opened for company ${companyId}`);
    }
    return this.companySubjects.get(companyId)!;
  }

  push(
    companyId: string,
    event: string,
    entityType: string,
    payload?: unknown,
  ) {
    const subject = this.companySubjects.get(companyId);
    if (subject) {
      subject.next({ event, entityType, ...(payload ? { payload } : {}) });
    }
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
