import { DomainEvent, EventStatus } from '@prisma/client';
import { DomainEventTypes } from '../governance-events/types/events';

describe('Event Listener Behavior', () => {
  describe('WarningEngineListener', () => {
    const mockProcessor = () => ({
      process: jest
        .fn()
        .mockImplementation(
          (_event: DomainEvent, _name: string, handler: () => Promise<void>) =>
            handler(),
        ),
    });

    const mockPrisma = () => ({
      $transaction: jest.fn().mockImplementation(async (fn: Function) => {
        const tx = {
          task: {
            findUnique: jest
              .fn()
              .mockResolvedValue({ id: 'task-1', assigneeId: 'emp-1' }),
          },
        };
        return fn(tx);
      }),
    });

    const mockPublisher = () => ({
      publish: jest.fn(),
    });

    const mockWarningsService = () => ({
      issueWarning: jest.fn().mockResolvedValue({ id: 'warning-1' }),
    });

    const baseEvent = (overrides?: Partial<DomainEvent>): DomainEvent =>
      ({
        id: 'evt-1',
        eventType: DomainEventTypes.TASK_OVERDUE,
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
      }) as DomainEvent;

    it('issues warning via warningsService when task is found', async () => {
      const processor = mockProcessor();
      const prisma = mockPrisma();
      const publisher = mockPublisher();
      const warningsService = mockWarningsService();

      const { WarningEngineListener } =
        await import('./listeners/warning-engine.listener');
      const listener = new WarningEngineListener(
        processor as never,
        prisma as never,
        publisher as never,
        warningsService as never,
      );

      await listener.handleTaskOverdue(baseEvent());

      expect(warningsService.issueWarning).toHaveBeenCalled();
    });

    it('processes through processor with correct handler name', async () => {
      const processor = mockProcessor();
      const prisma = mockPrisma();
      const publisher = mockPublisher();

      const { WarningEngineListener } =
        await import('./listeners/warning-engine.listener');
      const listener = new WarningEngineListener(
        processor as never,
        prisma as never,
        publisher as never,
        mockWarningsService() as never,
      );

      await listener.handleTaskOverdue(baseEvent());

      expect(processor.process).toHaveBeenCalledWith(
        expect.anything(),
        'WarningEngineListener_handleTaskOverdue',
        expect.any(Function),
      );
    });
  });

  describe('PayrollHoldActivationListener', () => {
    const mockProcessor = () => ({
      process: jest
        .fn()
        .mockImplementation(
          (_event: DomainEvent, _name: string, handler: () => Promise<void>) =>
            handler(),
        ),
    });

    const mockPrisma = () => ({
      $transaction: jest
        .fn()
        .mockImplementation(async (fn: Function) => fn({
          payrollHold: { update: jest.fn() },
          payrollHoldHistory: { create: jest.fn() },
        })),
    });

    const mockPublisher = () => ({
      publish: jest.fn(),
    });

    const approvalEvent = (entityType: string): DomainEvent =>
      ({
        id: 'evt-2',
        eventType: DomainEventTypes.APPROVAL_APPROVED,
        entityId: 'hold-1',
        entityType,
        payload: { companyId: 'comp-1' },
        correlationId: 'corr-2',
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
      }) as DomainEvent;

    it('processes PAYROLL_HOLD entity type', async () => {
      const processor = mockProcessor();
      const prisma = mockPrisma();
      const publisher = mockPublisher();

      const { PayrollHoldActivationListener } =
        await import('./listeners/payroll-hold-activation.listener');
      const listener = new PayrollHoldActivationListener(
        processor as never,
        publisher as never,
        prisma as never,
      );

      await listener.handleApprovalApproved(approvalEvent('PAYROLL_HOLD'));

      expect(publisher.publish).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          eventType: DomainEventTypes.PAYROLL_HOLD_ACTIVATED,
        }),
      );
    });

    it('ignores non-PAYROLL_HOLD entity types', async () => {
      const processor = mockProcessor();
      const prisma = mockPrisma();
      const publisher = mockPublisher();

      const { PayrollHoldActivationListener } =
        await import('./listeners/payroll-hold-activation.listener');
      const listener = new PayrollHoldActivationListener(
        processor as never,
        publisher as never,
        prisma as never,
      );

      await listener.handleApprovalApproved(approvalEvent('EXPENSE_CLAIM'));

      expect(publisher.publish).not.toHaveBeenCalled();
    });
  });

  describe('PayrollHoldReleaseListener', () => {
    const mockProcessor = () => ({
      process: jest
        .fn()
        .mockImplementation(
          (_event: DomainEvent, _name: string, handler: () => Promise<void>) =>
            handler(),
        ),
    });

    const mockPrisma = () => ({
      payrollHold: {
        findMany: jest.fn(),
      },
    });

    const mockPublisher = () => ({
      publish: jest.fn(),
    });

    const taskCompletedEvent = (taskId: string): DomainEvent =>
      ({
        id: 'evt-3',
        eventType: DomainEventTypes.TASK_COMPLETED,
        entityId: taskId,
        entityType: 'TASK',
        payload: { companyId: 'comp-1' },
        correlationId: 'corr-3',
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
      }) as DomainEvent;

    it('publishes PAYROLL_HOLD_RELEASE_REQUESTED for active holds', async () => {
      const processor = mockProcessor();
      const prisma = mockPrisma();
      const publisher = mockPublisher();
      prisma.payrollHold.findMany.mockResolvedValue([
        {
          id: 'hold-1',
          source: 'TASK_ENGINE',
          sourceId: 'task-1',
          status: 'ACTIVE_HOLD',
        },
      ]);

      const { PayrollHoldReleaseListener } =
        await import('./listeners/payroll-hold-release.listener');
      const listener = new PayrollHoldReleaseListener(
        processor as never,
        prisma as never,
        publisher as never,
      );

      await listener.handleTaskCompleted(taskCompletedEvent('task-1'));

      expect(publisher.publish).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          eventType: DomainEventTypes.PAYROLL_HOLD_RELEASE_REQUESTED,
          entityType: 'PAYROLL_HOLD',
        }),
      );
    });

    it('does not publish when no active holds found', async () => {
      const processor = mockProcessor();
      const prisma = mockPrisma();
      const publisher = mockPublisher();
      prisma.payrollHold.findMany.mockResolvedValue([]);

      const { PayrollHoldReleaseListener } =
        await import('./listeners/payroll-hold-release.listener');
      const listener = new PayrollHoldReleaseListener(
        processor as never,
        prisma as never,
        publisher as never,
      );

      await listener.handleTaskCompleted(taskCompletedEvent('task-1'));

      expect(publisher.publish).not.toHaveBeenCalled();
    });

    it('publishes for each active hold separately', async () => {
      const processor = mockProcessor();
      const prisma = mockPrisma();
      const publisher = mockPublisher();
      prisma.payrollHold.findMany.mockResolvedValue([
        {
          id: 'hold-1',
          source: 'TASK_ENGINE',
          sourceId: 'task-1',
          status: 'ACTIVE_HOLD',
        },
        {
          id: 'hold-2',
          source: 'TASK_ENGINE',
          sourceId: 'task-1',
          status: 'ACTIVE_HOLD',
        },
      ]);

      const { PayrollHoldReleaseListener } =
        await import('./listeners/payroll-hold-release.listener');
      const listener = new PayrollHoldReleaseListener(
        processor as never,
        prisma as never,
        publisher as never,
      );

      await listener.handleTaskCompleted(taskCompletedEvent('task-1'));

      expect(publisher.publish).toHaveBeenCalledTimes(2);
    });
  });

  describe('ApprovalEngineListener', () => {
    const mockProcessor = () => ({
      process: jest
        .fn()
        .mockImplementation(
          (_event: DomainEvent, _name: string, handler: () => Promise<void>) =>
            handler(),
        ),
    });

    const mockPrisma = (existingRequest?: any) => ({
      approvalRequest: {
        findFirst: jest.fn().mockResolvedValue(existingRequest ?? null),
      },
      user: {
        findFirst: jest.fn().mockResolvedValue({ id: 'owner-1' }),
      },
    });

    const mockPublisher = () => ({
      publish: jest.fn(),
    });

    const mockSpawningService = () => ({
      spawnRequest: jest.fn(),
    });

    const disciplinaryEvent = (): DomainEvent =>
      ({
        id: 'evt-disc-1',
        eventType: DomainEventTypes.DISCIPLINARY_REVIEW_TRIGGERED,
        entityId: 'warn-1',
        entityType: 'WARNING',
        payload: { companyId: 'comp-1' },
        correlationId: 'corr-disc-1',
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
      }) as DomainEvent;

    it('publishes APPROVAL_CREATED for an existing pending disciplinary review', async () => {
      const existing = {
        id: 'req-1',
        companyId: 'comp-1',
        entityType: 'DISCIPLINARY_REVIEW',
        entityId: 'warn-1',
      };
      const processor = mockProcessor();
      const prisma = mockPrisma(existing);
      const publisher = mockPublisher();
      const spawning = mockSpawningService();

      const { ApprovalEngineListener } =
        await import('./listeners/approval-engine.listener');
      const listener = new ApprovalEngineListener(
        processor as never,
        publisher as never,
        prisma as never,
        spawning as never,
      );

      await listener.handleDisciplinaryReview(disciplinaryEvent());

      expect(publisher.publish).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          eventType: DomainEventTypes.APPROVAL_CREATED,
          entityId: 'warn-1',
          entityType: 'DISCIPLINARY_REVIEW',
        }),
      );
      expect(spawning.spawnRequest).not.toHaveBeenCalled();
    });

    it('spawns a disciplinary review when no pending request exists', async () => {
      const processor = mockProcessor();
      const prisma = mockPrisma(null);
      const publisher = mockPublisher();
      const spawning = mockSpawningService();

      const { ApprovalEngineListener } =
        await import('./listeners/approval-engine.listener');
      const listener = new ApprovalEngineListener(
        processor as never,
        publisher as never,
        prisma as never,
        spawning as never,
      );

      await listener.handleDisciplinaryReview(disciplinaryEvent());

      expect(spawning.spawnRequest).toHaveBeenCalledWith(
        'comp-1',
        'DISCIPLINARY_REVIEW',
        'warn-1',
        'owner-1',
      );
      expect(publisher.publish).not.toHaveBeenCalled();
    });

    it('processes through processor with correct handler name', async () => {
      const processor = mockProcessor();
      const prisma = mockPrisma(null);
      const publisher = mockPublisher();
      const spawning = mockSpawningService();

      const { ApprovalEngineListener } =
        await import('./listeners/approval-engine.listener');
      const listener = new ApprovalEngineListener(
        processor as never,
        publisher as never,
        prisma as never,
        spawning as never,
      );

      await listener.handleDisciplinaryReview(disciplinaryEvent());

      expect(processor.process).toHaveBeenCalledWith(
        expect.anything(),
        'ApprovalEngineListener_handleDisciplinaryReview',
        expect.any(Function),
      );
    });
  });

  describe('WarningEngineApprovalListener', () => {
    const mockProcessor = () => ({
      process: jest
        .fn()
        .mockImplementation(
          (_event: DomainEvent, _name: string, handler: () => Promise<void>) =>
            handler(),
        ),
    });

    const mockPrisma = () => ({
      warning: { update: jest.fn() },
    });

    const approvalEvent = (eventType: string, entityType: string): DomainEvent =>
      ({
        id: 'evt-warn-app-1',
        eventType,
        entityId: 'warn-1',
        entityType,
        payload: { companyId: 'comp-1', warningId: 'warn-1' },
        correlationId: 'corr-warn-app-1',
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
      }) as DomainEvent;

    it('updates warning to APPROVED when approval approved for WARNING entity', async () => {
      const processor = mockProcessor();
      const prisma = mockPrisma();
      const { WarningEngineApprovalListener } =
        await import('./listeners/warning-engine-approval.listener');
      const listener = new WarningEngineApprovalListener(
        processor as never,
        prisma as never,
      );

      await listener.handleApprovalOutcome(
        approvalEvent(DomainEventTypes.APPROVAL_APPROVED, 'WARNING'),
      );

      expect(prisma.warning.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'warn-1' },
          data: { status: 'APPROVED' },
        }),
      );
    });

    it('updates warning to REJECTED when approval rejected for WARNING entity', async () => {
      const processor = mockProcessor();
      const prisma = mockPrisma();
      const { WarningEngineApprovalListener } =
        await import('./listeners/warning-engine-approval.listener');
      const listener = new WarningEngineApprovalListener(
        processor as never,
        prisma as never,
      );

      await listener.handleApprovalOutcome(
        approvalEvent(DomainEventTypes.APPROVAL_REJECTED, 'WARNING'),
      );

      expect(prisma.warning.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'warn-1' },
          data: { status: 'REJECTED' },
        }),
      );
    });

    it('ignores non-WARNING entity types', async () => {
      const processor = mockProcessor();
      const prisma = mockPrisma();
      const { WarningEngineApprovalListener } =
        await import('./listeners/warning-engine-approval.listener');
      const listener = new WarningEngineApprovalListener(
        processor as never,
        prisma as never,
      );

      await listener.handleApprovalOutcome(
        approvalEvent(DomainEventTypes.APPROVAL_APPROVED, 'EXPENSE_CLAIM'),
      );

      expect(prisma.warning.update).not.toHaveBeenCalled();
    });
  });

  describe('TaskEscalationNotificationListener', () => {
    const mockProcessor = () => ({
      process: jest
        .fn()
        .mockImplementation(
          (_event: DomainEvent, _name: string, handler: () => Promise<void>) =>
            handler(),
        ),
    });

    let mockPrisma: any;
    let mockNotificationsService: any;

    const baseTask = {
      id: 'task-1',
      title: 'Overdue Task',
      assigneeId: 'emp-1',
      creatorId: 'emp-2',
      escalationLevel: 2,
      companyId: 'comp-1',
      employeesTasksAssigneeIdToemployees: {
        managerId: 'mgr-1',
        userId: 'user-emp-1',
        companyId: 'comp-1',
      },
      employeesTasksCreatorIdToemployees: {
        userId: 'user-creator-1',
      },
      companies: { id: 'comp-1' },
    };

    beforeEach(() => {
      mockPrisma = {
        task: {
          findUnique: jest.fn().mockResolvedValue(baseTask),
        },
        employee: {
          findUnique: jest.fn().mockResolvedValue({ userId: 'user-mgr-1' }),
        },
        user: {
          findMany: jest.fn().mockResolvedValue([
            { id: 'user-hr-1' },
            { id: 'user-owner-1' },
          ]),
        },
        taskProof: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'proof-1',
            taskId: 'task-1',
            tasks: {
              employeesTasksAssigneeIdToemployees: {
                companyId: 'comp-1',
              },
            },
          }),
        },
        warning: {
          create: jest.fn().mockResolvedValue({ id: 'warning-auto-1' }),
        },
      };
      mockNotificationsService = {
        create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
      };
    });

    const escalationEvent = (
      eventType: string,
      escalationLevel = 2,
    ): DomainEvent =>
      ({
        id: `evt-esc-${Date.now()}`,
        eventType,
        entityId: 'task-1',
        entityType: 'TASK',
        payload: {
          companyId: 'comp-1',
          escalationLevel,
          assigneeId: 'emp-1',
        },
        correlationId: 'corr-esc-1',
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
      }) as DomainEvent;

    it('creates notification for manager on TASK_ESCALATED_MANAGER', async () => {
      const processor = mockProcessor();
      const { TaskEscalationNotificationListener } =
        await import('./listeners/task-escalation-notification.listener');
      const listener = new TaskEscalationNotificationListener(
        processor as never,
        mockPrisma as never,
        mockNotificationsService as never,
      );

      await listener.handleEscalatedToManager(
        escalationEvent(DomainEventTypes.TASK_ESCALATED_MANAGER),
      );

      expect(mockNotificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-mgr-1',
          title: 'Task Escalated to You',
          type: 'WARNING',
        }),
      );
    });

    it('creates notifications for HR/OWNER on TASK_ESCALATED_HR', async () => {
      const processor = mockProcessor();
      const { TaskEscalationNotificationListener } =
        await import('./listeners/task-escalation-notification.listener');
      const listener = new TaskEscalationNotificationListener(
        processor as never,
        mockPrisma as never,
        mockNotificationsService as never,
      );

      await listener.handleEscalatedToHR(
        escalationEvent(DomainEventTypes.TASK_ESCALATED_HR),
      );

      expect(mockNotificationsService.create).toHaveBeenCalledTimes(2);
      expect(mockNotificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-hr-1',
          title: 'Task Escalated to HR',
        }),
      );
    });

    it('creates warning record when escalation level >= 3 on TASK_ESCALATED_HR', async () => {
      const processor = mockProcessor();
      // Override task with higher escalation level
      mockPrisma.task.findUnique = jest.fn().mockResolvedValue({
        ...baseTask,
        escalationLevel: 3,
      });

      const { TaskEscalationNotificationListener } =
        await import('./listeners/task-escalation-notification.listener');
      const listener = new TaskEscalationNotificationListener(
        processor as never,
        mockPrisma as never,
        mockNotificationsService as never,
      );

      await listener.handleEscalatedToHR(
        escalationEvent(DomainEventTypes.TASK_ESCALATED_HR, 3),
      );

      expect(mockPrisma.warning.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            employeeId: 'emp-1',
            category: 'TASK_PERFORMANCE',
            severity: 'LEVEL_2_WRITTEN',
          }),
        }),
      );
    });

    it('creates notification on TASK_PROOF_ESCALATED_HR', async () => {
      const processor = mockProcessor();
      const { TaskEscalationNotificationListener } =
        await import('./listeners/task-escalation-notification.listener');
      const listener = new TaskEscalationNotificationListener(
        processor as never,
        mockPrisma as never,
        mockNotificationsService as never,
      );

      await listener.handleProofEscalatedToHR(
        escalationEvent(DomainEventTypes.TASK_PROOF_ESCALATED_HR),
      );

      expect(mockPrisma.taskProof.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'task-1' } }),
      );
      expect(mockNotificationsService.create).toHaveBeenCalled();
    });

    it('creates notification on TASK_EXTENSION_REQUESTED', async () => {
      const processor = mockProcessor();
      const { TaskEscalationNotificationListener } =
        await import('./listeners/task-escalation-notification.listener');
      const listener = new TaskEscalationNotificationListener(
        processor as never,
        mockPrisma as never,
        mockNotificationsService as never,
      );

      await listener.handleExtensionRequested(
        escalationEvent(DomainEventTypes.TASK_EXTENSION_REQUESTED),
      );

      expect(mockNotificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-creator-1',
          title: 'Extension Requested',
          type: 'INFO',
        }),
      );
    });

    it('gracefully handles missing task on escalation', async () => {
      const processor = mockProcessor();
      mockPrisma.task.findUnique = jest.fn().mockResolvedValue(null);

      const { TaskEscalationNotificationListener } =
        await import('./listeners/task-escalation-notification.listener');
      const listener = new TaskEscalationNotificationListener(
        processor as never,
        mockPrisma as never,
        mockNotificationsService as never,
      );

      await listener.handleEscalatedToManager(
        escalationEvent(DomainEventTypes.TASK_ESCALATED_MANAGER),
      );

      expect(mockNotificationsService.create).not.toHaveBeenCalled();
    });
  });
});
