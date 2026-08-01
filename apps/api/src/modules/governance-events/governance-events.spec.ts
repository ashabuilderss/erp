import { EventStatus, ProcessedEventStatus, DomainEvent } from '@prisma/client';
import { GovernanceEventProcessor } from './governance-event.processor';
import { DomainEventTypes } from './types/events';

describe('GovernanceEventProcessor', () => {
  const mockPrisma = () => ({
    processedEvent: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    securityEvent: {
      create: jest.fn(),
    },
  });

  const buildProcessor = (prismaOverrides?: ReturnType<typeof mockPrisma>) => {
    const prisma = prismaOverrides ?? mockPrisma();
    const processor = new GovernanceEventProcessor(prisma as never);
    return { processor, prisma };
  };

  const baseEvent = {
    id: 'evt-1',
    eventType: DomainEventTypes.TASK_COMPLETED,
    entityId: 'task-1',
    entityType: 'TASK',
    payload: { companyId: 'comp-1' },
    correlationId: 'corr-1',
    parentEventId: null,
    eventVersion: 1,
    status: EventStatus.PENDING,
    attemptCount: 0,
    lastError: null,
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    companyId: 'comp-1',
    deletedAt: null,
  } as DomainEvent;

  describe('process', () => {
    it('skips processing if already SUCCESS', async () => {
      const { processor, prisma } = buildProcessor();
      prisma.processedEvent.findUnique.mockResolvedValue({
        eventId: 'evt-1',
        handlerName: 'TestHandler',
        status: ProcessedEventStatus.SUCCESS,
        retryCount: 0,
      });
      const handler = jest.fn();

      await processor.process(baseEvent, 'TestHandler', handler);

      expect(handler).not.toHaveBeenCalled();
      expect(prisma.processedEvent.create).not.toHaveBeenCalled();
      expect(prisma.processedEvent.update).not.toHaveBeenCalled();
    });

    it('creates ProcessedEvent as PENDING if not exists', async () => {
      const { processor, prisma } = buildProcessor();
      prisma.processedEvent.findUnique.mockResolvedValue(null);
      prisma.processedEvent.create.mockResolvedValue({
        eventId: 'evt-1',
        handlerName: 'TestHandler',
        status: ProcessedEventStatus.PENDING,
        retryCount: 0,
      });
      const handler = jest.fn().mockResolvedValue(undefined);

      await processor.process(baseEvent, 'TestHandler', handler);

      expect(prisma.processedEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventId: 'evt-1',
            handlerName: 'TestHandler',
            status: ProcessedEventStatus.PENDING,
          }),
        }),
      );
    });

    it('marks SUCCESS after handler completes', async () => {
      const { processor, prisma } = buildProcessor();
      prisma.processedEvent.findUnique.mockResolvedValue(null);
      prisma.processedEvent.create.mockResolvedValue({
        eventId: 'evt-1',
        handlerName: 'TestHandler',
        status: ProcessedEventStatus.PENDING,
        retryCount: 0,
      });
      const handler = jest.fn().mockResolvedValue(undefined);

      await processor.process(baseEvent, 'TestHandler', handler);

      expect(prisma.processedEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ProcessedEventStatus.SUCCESS,
            lastError: null,
          }),
        }),
      );
    });

    it('marks FAILED on handler error with retry', async () => {
      const { processor, prisma } = buildProcessor();
      prisma.processedEvent.findUnique.mockResolvedValue(null);
      prisma.processedEvent.create.mockResolvedValue({
        eventId: 'evt-1',
        handlerName: 'TestHandler',
        status: ProcessedEventStatus.PENDING,
        retryCount: 0,
      });
      const handler = jest.fn().mockRejectedValue(new Error('DB timeout'));

      await processor.process(baseEvent, 'TestHandler', handler);

      expect(prisma.processedEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ProcessedEventStatus.FAILED,
            retryCount: 1,
            lastError: 'DB timeout',
          }),
        }),
      );
    });

    it('marks DEAD_LETTER after 3 retries', async () => {
      const { processor, prisma } = buildProcessor();
      prisma.processedEvent.findUnique.mockResolvedValue(null);
      prisma.processedEvent.create.mockResolvedValue({
        eventId: 'evt-1',
        handlerName: 'TestHandler',
        status: ProcessedEventStatus.PENDING,
        retryCount: 2, // Already retried 2 times
      });
      const handler = jest
        .fn()
        .mockRejectedValue(new Error('Permanent failure'));

      await processor.process(baseEvent, 'TestHandler', handler);

      expect(prisma.processedEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ProcessedEventStatus.DEAD_LETTER,
            retryCount: 3,
          }),
        }),
      );
    });

    it('creates SecurityEvent on dead letter', async () => {
      const { processor, prisma } = buildProcessor();
      prisma.processedEvent.findUnique.mockResolvedValue(null);
      prisma.processedEvent.create.mockResolvedValue({
        eventId: 'evt-1',
        handlerName: 'TestHandler',
        status: ProcessedEventStatus.PENDING,
        retryCount: 2,
      });
      const handler = jest
        .fn()
        .mockRejectedValue(new Error('Permanent failure'));

      await processor.process(baseEvent, 'TestHandler', handler);

      expect(prisma.securityEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'EVENT_DEAD_LETTERED',
            severity: 'critical',
          }),
        }),
      );
    });

    it('does not create SecurityEvent for non-dead-letter failures', async () => {
      const { processor, prisma } = buildProcessor();
      prisma.processedEvent.findUnique.mockResolvedValue(null);
      prisma.processedEvent.create.mockResolvedValue({
        eventId: 'evt-1',
        handlerName: 'TestHandler',
        status: ProcessedEventStatus.PENDING,
        retryCount: 0,
      });
      const handler = jest
        .fn()
        .mockRejectedValue(new Error('Temporary failure'));

      await processor.process(baseEvent, 'TestHandler', handler);

      expect(prisma.securityEvent.create).not.toHaveBeenCalled();
    });

    it('does not throw on handler failure (error swallowed)', async () => {
      const { processor, prisma } = buildProcessor();
      prisma.processedEvent.findUnique.mockResolvedValue(null);
      prisma.processedEvent.create.mockResolvedValue({
        eventId: 'evt-1',
        handlerName: 'TestHandler',
        status: ProcessedEventStatus.PENDING,
        retryCount: 0,
      });
      const handler = jest.fn().mockRejectedValue(new Error('Handler error'));

      await expect(
        processor.process(baseEvent, 'TestHandler', handler),
      ).resolves.not.toThrow();
    });

    it('uses existing FAILED ProcessedEvent for retry', async () => {
      const { processor, prisma } = buildProcessor();
      prisma.processedEvent.findUnique.mockResolvedValue({
        eventId: 'evt-1',
        handlerName: 'TestHandler',
        status: ProcessedEventStatus.FAILED,
        retryCount: 1,
      });
      const handler = jest.fn().mockResolvedValue(undefined);

      await processor.process(baseEvent, 'TestHandler', handler);

      expect(prisma.processedEvent.create).not.toHaveBeenCalled();
      expect(prisma.processedEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ProcessedEventStatus.SUCCESS,
          }),
        }),
      );
    });
  });
});

describe('GovernanceEventPublisher', () => {
  it('creates DomainEvent with PENDING status', async () => {
    const mockTx = {
      domainEvent: {
        create: jest.fn().mockResolvedValue({ id: 'evt-new' }),
      },
    };

    const { GovernanceEventPublisher } =
      await import('./governance-event.publisher');
    const publisher = new GovernanceEventPublisher({} as never);

    await publisher.publish(mockTx as never, {
      eventType: DomainEventTypes.TASK_CREATED,
      entityId: 'task-1',
      entityType: 'TASK',
      companyId: 'comp-1',
      payload: { companyId: 'comp-1' },
    });

    expect(mockTx.domainEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: DomainEventTypes.TASK_CREATED,
          entityId: 'task-1',
          entityType: 'TASK',
          status: EventStatus.PENDING,
        }),
      }),
    );
  });

  it('generates correlationId when not provided', async () => {
    const mockTx = {
      domainEvent: {
        create: jest.fn().mockResolvedValue({ id: 'evt-new' }),
      },
    };

    const { GovernanceEventPublisher } =
      await import('./governance-event.publisher');
    const publisher = new GovernanceEventPublisher({} as never);

    await publisher.publish(mockTx as never, {
      eventType: DomainEventTypes.TASK_CREATED,
      entityId: 'task-1',
      entityType: 'TASK',
      companyId: 'comp-1',
      payload: { companyId: 'comp-1' },
    });

    const createCall = mockTx.domainEvent.create.mock.calls[0][0];
    expect(createCall.data.correlationId).toBeDefined();
    expect(typeof createCall.data.correlationId).toBe('string');
  });

  it('uses provided correlationId', async () => {
    const mockTx = {
      domainEvent: {
        create: jest.fn().mockResolvedValue({ id: 'evt-new' }),
      },
    };

    const { GovernanceEventPublisher } =
      await import('./governance-event.publisher');
    const publisher = new GovernanceEventPublisher({} as never);

    await publisher.publish(mockTx as never, {
      eventType: DomainEventTypes.TASK_CREATED,
      entityId: 'task-1',
      entityType: 'TASK',
      companyId: 'comp-1',
      payload: { companyId: 'comp-1' },
      correlationId: 'custom-corr-1',
    });

    const createCall = mockTx.domainEvent.create.mock.calls[0][0];
    expect(createCall.data.correlationId).toBe('custom-corr-1');
  });

  it('sets parentEventId when provided', async () => {
    const mockTx = {
      domainEvent: {
        create: jest.fn().mockResolvedValue({ id: 'evt-new' }),
      },
    };

    const { GovernanceEventPublisher } =
      await import('./governance-event.publisher');
    const publisher = new GovernanceEventPublisher({} as never);

    await publisher.publish(mockTx as never, {
      eventType: DomainEventTypes.WARNING_CREATED,
      entityId: 'warn-1',
      entityType: 'WARNING',
      companyId: 'comp-1',
      payload: { companyId: 'comp-1' },
      parentEventId: 'evt-parent',
    });

    const createCall = mockTx.domainEvent.create.mock.calls[0][0];
    expect(createCall.data.parentEventId).toBe('evt-parent');
  });
});
