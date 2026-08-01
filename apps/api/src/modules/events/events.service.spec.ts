import { EventsService } from './events.service';
import { RealtimeGateway } from '../../common/realtime/realtime.gateway';

describe('EventsService', () => {
  let service: EventsService;
  let mockRealtimeGateway: RealtimeGateway;

  beforeEach(() => {
    mockRealtimeGateway = { broadcastToCompany: jest.fn() } as never;
    service = new EventsService(mockRealtimeGateway);
  });

  describe('push', () => {
    it('broadcasts event to company via realtime gateway', () => {
      service.push('company-1', 'test.event', 'Task', { id: '1' });

      expect(mockRealtimeGateway.broadcastToCompany).toHaveBeenCalledWith(
        'company-1',
        'test.event',
        {
          event: 'test.event',
          entityType: 'Task',
          payload: { id: '1' },
        },
      );
    });

    it('omits payload when not provided', () => {
      service.push('company-1', 'test.event', 'Task');

      expect(mockRealtimeGateway.broadcastToCompany).toHaveBeenCalledWith(
        'company-1',
        'test.event',
        { event: 'test.event', entityType: 'Task' },
      );
    });
  });

  describe('event handlers', () => {
    it('handleCreate pushes created event', () => {
      service.push = jest.fn();
      service.handleCreate({ companyId: 'company-1', entityId: '1', action: 'created' });

      expect(service.push).toHaveBeenCalledWith('company-1', 'created', '');
    });

    it('handleUpdate pushes updated event', () => {
      service.push = jest.fn();
      service.handleUpdate({ companyId: 'company-1', entityId: '1', action: 'updated' });

      expect(service.push).toHaveBeenCalledWith('company-1', 'updated', '');
    });

    it('handleDelete pushes deleted event', () => {
      service.push = jest.fn();
      service.handleDelete({ companyId: 'company-1', entityId: '1', action: 'deleted' });

      expect(service.push).toHaveBeenCalledWith('company-1', 'deleted', '');
    });
  });
});
