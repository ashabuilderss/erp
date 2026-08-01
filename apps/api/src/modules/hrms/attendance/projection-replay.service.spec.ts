import { ReplayOrchestrationService } from './projection-replay.service';

describe('ReplayOrchestrationService', () => {
  it('replays business events and skips projection health events', async () => {
    const prisma = {
      domainEvent: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'event-1', eventType: 'ATTENDANCE_FINALIZED' },
          { id: 'event-2', eventType: 'PROJECTION_HEALTH_DRIFT_DETECTED' },
        ]),
      },
      processedEvent: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    const emitter = {
      emitAsync: jest.fn(),
    };
    const service = new ReplayOrchestrationService(
      prisma as never,
      emitter as never,
    );

    const result = await service.replayAttendanceProjections('company-1');

    expect(result.replayed).toBe(1);
    expect(prisma.processedEvent.deleteMany).toHaveBeenCalledWith({
      where: { eventId: { in: ['event-1'] } },
    });
    expect(emitter.emitAsync).toHaveBeenCalledTimes(1);
    expect(emitter.emitAsync).toHaveBeenCalledWith('ATTENDANCE_FINALIZED', {
      id: 'event-1',
      eventType: 'ATTENDANCE_FINALIZED',
    });
  });
});
