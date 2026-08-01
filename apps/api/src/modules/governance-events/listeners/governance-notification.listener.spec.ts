import { DomainEvent, EventStatus } from '@prisma/client';
import { DomainEventTypes } from '../types/events';

describe('GovernanceNotificationListener', () => {
  const createDomainEvent = (
    eventType: string,
    entityId: string,
    entityType: string,
    payload: Record<string, unknown> = {},
  ): DomainEvent =>
    ({
      id: 'evt-1',
      eventType,
      entityId,
      entityType,
      payload: { companyId: 'comp-1', ...payload },
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

  const mockProcessor = () => ({
    process: jest
      .fn()
      .mockImplementation(
        (_event: DomainEvent, _name: string, handler: () => Promise<void>) =>
          handler(),
      ),
  });

  const mockNotificationsService = () => ({
    create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
  });

  const mockOwnersPrisma = (owners: string[]) => ({
    user: {
      findMany: jest.fn().mockResolvedValue(owners.map((id) => ({ id }))),
    },
  });

  describe('owner feed handlers (§5.30)', () => {
    it('handleDocumentUploaded notifies company owners', async () => {
      const processor = mockProcessor();
      const prisma = mockOwnersPrisma(['user-owner-1', 'user-owner-2']);
      const notificationsService = mockNotificationsService();

      const { GovernanceNotificationListener } =
        await import('./governance-notification.listener');
      const listener = new GovernanceNotificationListener(
        processor as never,
        prisma as never,
        notificationsService as never,
      );

      await listener.handleDocumentUploaded(
        createDomainEvent(
          DomainEventTypes.DOCUMENT_UPLOADED,
          'doc-1',
          'DocumentRegistry',
          { name: 'invoice.pdf', uploadedById: 'user-uploader-1' },
        ),
      );

      expect(notificationsService.create).toHaveBeenCalledTimes(2);
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-owner-1',
          title: 'Document uploaded',
          message: expect.stringContaining('invoice.pdf'),
          type: 'SYSTEM',
          link: '/dashboard/documents',
        }),
      );
    });

    it('handleDocumentUploaded skips the acting user', async () => {
      const processor = mockProcessor();
      const prisma = mockOwnersPrisma(['user-owner-1']);
      const notificationsService = mockNotificationsService();

      const { GovernanceNotificationListener } =
        await import('./governance-notification.listener');
      const listener = new GovernanceNotificationListener(
        processor as never,
        prisma as never,
        notificationsService as never,
      );

      await listener.handleDocumentUploaded(
        createDomainEvent(DomainEventTypes.DOCUMENT_UPLOADED, 'doc-1', 'DocumentRegistry', {
          name: 'invoice.pdf',
          uploadedById: 'user-owner-1',
        }),
      );

      expect(notificationsService.create).not.toHaveBeenCalled();
    });

    it('handleLeadStatusChanged notifies owners with status transition', async () => {
      const processor = mockProcessor();
      const prisma = mockOwnersPrisma(['user-owner-1']);
      const notificationsService = mockNotificationsService();

      const { GovernanceNotificationListener } =
        await import('./governance-notification.listener');
      const listener = new GovernanceNotificationListener(
        processor as never,
        prisma as never,
        notificationsService as never,
      );

      await listener.handleLeadStatusChanged(
        createDomainEvent(DomainEventTypes.LEAD_STATUS_CHANGED, 'lead-1', 'Lead', {
          userId: 'emp-1',
          metadata: {
            previousStatus: 'NEW',
            newStatus: 'CONVERTED',
            leadName: 'Rahul Sharma',
          },
        }),
      );

      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-owner-1',
          title: 'Lead status changed',
          message: expect.stringContaining('Rahul Sharma'),
        }),
      );
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('NEW'),
        }),
      );
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('CONVERTED'),
        }),
      );
    });

    it('handleBookingCreated notifies owners with property and customer', async () => {
      const processor = mockProcessor();
      const prisma = mockOwnersPrisma(['user-owner-1']);
      const notificationsService = mockNotificationsService();

      const { GovernanceNotificationListener } =
        await import('./governance-notification.listener');
      const listener = new GovernanceNotificationListener(
        processor as never,
        prisma as never,
        notificationsService as never,
      );

      await listener.handleBookingCreated(
        createDomainEvent(DomainEventTypes.BOOKING_CREATED, 'b-1', 'Booking', {
          userId: 'emp-1',
          metadata: { propertyTitle: '2BHK Greenview', customerName: 'Rahul Sharma' },
        }),
      );

      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-owner-1',
          title: 'Booking created',
          message: expect.stringContaining('2BHK Greenview'),
          type: 'SYSTEM',
          link: '/dashboard/bookings',
        }),
      );
    });

    it('handlePayrollProcessed notifies owners with run summary', async () => {
      const processor = mockProcessor();
      const prisma = mockOwnersPrisma(['user-owner-1']);
      const notificationsService = mockNotificationsService();

      const { GovernanceNotificationListener } =
        await import('./governance-notification.listener');
      const listener = new GovernanceNotificationListener(
        processor as never,
        prisma as never,
        notificationsService as never,
      );

      await listener.handlePayrollProcessed(
        createDomainEvent(DomainEventTypes.PAYROLL_PROCESSED, 'run-1', 'PayrollRun', {
          payrollRunId: 'run-1',
          processedById: 'user-1',
          employeeCount: 12,
          totalNetPay: 450000,
          heldEmployeeCount: 1,
        }),
      );

      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-owner-1',
          title: 'Payroll processed',
          type: 'SYSTEM',
          link: '/dashboard/payroll',
        }),
      );
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('12'),
        }),
      );
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('450000'),
        }),
      );
    });

    it('handleAttendanceFinalized notifies owners with finalized count', async () => {
      const processor = mockProcessor();
      const prisma = mockOwnersPrisma(['user-owner-1']);
      const notificationsService = mockNotificationsService();

      const { GovernanceNotificationListener } =
        await import('./governance-notification.listener');
      const listener = new GovernanceNotificationListener(
        processor as never,
        prisma as never,
        notificationsService as never,
      );

      await listener.handleAttendanceFinalized(
        createDomainEvent(
          DomainEventTypes.ATTENDANCE_FINALIZED,
          'batch-1',
          'AttendanceFinalizationBatch',
          { finalized: [{ employeeId: 'e1' }, { employeeId: 'e2' }] },
        ),
      );

      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-owner-1',
          title: 'Attendance finalized',
          message: expect.stringContaining('2'),
          type: 'SYSTEM',
          link: '/dashboard/attendance',
        }),
      );
    });

    it('does nothing when companyId is missing', async () => {
      const processor = mockProcessor();
      const prisma = mockOwnersPrisma(['user-owner-1']);
      const notificationsService = mockNotificationsService();

      const { GovernanceNotificationListener } =
        await import('./governance-notification.listener');
      const listener = new GovernanceNotificationListener(
        processor as never,
        prisma as never,
        notificationsService as never,
      );

      await listener.handleBookingCreated(
        createDomainEvent(DomainEventTypes.BOOKING_CREATED, 'b-1', 'Booking', {
          companyId: '',
          metadata: {},
        }),
      );

      expect(prisma.user.findMany).not.toHaveBeenCalled();
      expect(notificationsService.create).not.toHaveBeenCalled();
    });
  });

  describe('handleTaskCompleted', () => {
    it('routes through the processor and notifies the task creator', async () => {
      const processor = mockProcessor();
      const prisma = {
        task: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'task-1',
            title: 'Ship inventory',
            creatorId: 'emp-1',
          }),
        },
        employee: {
          findUnique: jest.fn().mockResolvedValue({ userId: 'user-creator-1' }),
        },
      };
      const notificationsService = mockNotificationsService();

      const { GovernanceNotificationListener } =
        await import('./governance-notification.listener');
      const listener = new GovernanceNotificationListener(
        processor as never,
        prisma as never,
        notificationsService as never,
      );

      await listener.handleTaskCompleted(
        createDomainEvent(DomainEventTypes.TASK_COMPLETED, 'task-1', 'TASK'),
      );

      expect(processor.process).toHaveBeenCalledTimes(1);
      expect(prisma.task.findUnique).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        select: { title: true, creatorId: true },
      });
      // Task.creatorId is an Employee id -> resolved to a User via Employee.
      expect(prisma.employee.findUnique).toHaveBeenCalledWith({
        where: { id: 'emp-1' },
        select: { userId: true },
      });
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: 'comp-1',
          userId: 'user-creator-1',
          title: 'Task completed',
          type: 'TASK',
          link: '/dashboard/my-tasks/task-1',
          message: expect.stringContaining('Ship inventory'),
        }),
      );
    });

    it('does not create a notification when the task is missing', async () => {
      const processor = mockProcessor();
      const prisma = {
        task: { findUnique: jest.fn().mockResolvedValue(null) },
        employee: { findUnique: jest.fn() },
      };
      const notificationsService = mockNotificationsService();

      const { GovernanceNotificationListener } =
        await import('./governance-notification.listener');
      const listener = new GovernanceNotificationListener(
        processor as never,
        prisma as never,
        notificationsService as never,
      );

      await listener.handleTaskCompleted(
        createDomainEvent(DomainEventTypes.TASK_COMPLETED, 'task-1', 'TASK'),
      );

      expect(notificationsService.create).not.toHaveBeenCalled();
    });

    it('does not create a notification when creator has no linked user', async () => {
      const processor = mockProcessor();
      const prisma = {
        task: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'task-1',
            title: 'Ship inventory',
            creatorId: 'emp-1',
          }),
        },
        employee: {
          findUnique: jest.fn().mockResolvedValue({ userId: null }),
        },
      };
      const notificationsService = mockNotificationsService();

      const { GovernanceNotificationListener } =
        await import('./governance-notification.listener');
      const listener = new GovernanceNotificationListener(
        processor as never,
        prisma as never,
        notificationsService as never,
      );

      await listener.handleTaskCompleted(
        createDomainEvent(DomainEventTypes.TASK_COMPLETED, 'task-1', 'TASK'),
      );

      expect(notificationsService.create).not.toHaveBeenCalled();
    });
  });

  describe('handleApprovalApproved', () => {
    it('notifies the approval requestor with APPROVAL_APPROVED', async () => {
      const processor = mockProcessor();
      const prisma = {
        approvalRequest: {
          findFirst: jest
            .fn()
            .mockResolvedValue({ createdById: 'user-requestor-1' }),
        },
      };
      const notificationsService = mockNotificationsService();

      const { GovernanceNotificationListener } =
        await import('./governance-notification.listener');
      const listener = new GovernanceNotificationListener(
        processor as never,
        prisma as never,
        notificationsService as never,
      );

      await listener.handleApprovalApproved(
        createDomainEvent(
          DomainEventTypes.APPROVAL_APPROVED,
          'hold-1',
          'PAYROLL_HOLD',
        ),
      );

      expect(prisma.approvalRequest.findFirst).toHaveBeenCalledWith({
        where: {
          companyId: 'comp-1',
          entityType: 'PAYROLL_HOLD',
          entityId: 'hold-1',
        },
        select: { createdById: true },
      });
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-requestor-1',
          title: expect.stringMatching(/approved/),
          type: 'APPROVAL',
        }),
      );
    });
  });

  describe('handleApprovalRejected', () => {
    it('notifies the requestor with APPROVAL_REJECTED', async () => {
      const processor = mockProcessor();
      const prisma = {
        approvalRequest: {
          findFirst: jest
            .fn()
            .mockResolvedValue({ createdById: 'user-requestor-1' }),
        },
      };
      const notificationsService = mockNotificationsService();

      const { GovernanceNotificationListener } =
        await import('./governance-notification.listener');
      const listener = new GovernanceNotificationListener(
        processor as never,
        prisma as never,
        notificationsService as never,
      );

      await listener.handleApprovalRejected(
        createDomainEvent(DomainEventTypes.APPROVAL_REJECTED, 'w-1', 'WARNING'),
      );

      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-requestor-1',
          title: expect.stringMatching(/rejected/),
          message: expect.stringContaining('warning'),
          type: 'APPROVAL',
        }),
      );
    });
  });

  describe('handlePayrollHoldReleaseRequested', () => {
    it('notifies the employee holding the payroll hold', async () => {
      const processor = mockProcessor();
      const prisma = {
        payrollHold: {
          findUnique: jest
            .fn()
            .mockResolvedValue({ id: 'hold-1', employeeId: 'emp-hold-1' }),
        },
        employee: {
          findUnique: jest
            .fn()
            .mockResolvedValue({ userId: 'user-employee-1' }),
        },
      };
      const notificationsService = mockNotificationsService();

      const { GovernanceNotificationListener } =
        await import('./governance-notification.listener');
      const listener = new GovernanceNotificationListener(
        processor as never,
        prisma as never,
        notificationsService as never,
      );

      await listener.handlePayrollHoldReleaseRequested(
        createDomainEvent(
          DomainEventTypes.PAYROLL_HOLD_RELEASE_REQUESTED,
          'hold-1',
          'PAYROLL_HOLD',
        ),
      );

      expect(prisma.payrollHold.findUnique).toHaveBeenCalledWith({
        where: { id: 'hold-1' },
        select: { employeeId: true },
      });
      expect(prisma.employee.findUnique).toHaveBeenCalledWith({
        where: { id: 'emp-hold-1' },
        select: { userId: true },
      });
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: 'comp-1',
          userId: 'user-employee-1',
          type: 'PAYROLL',
          link: '/dashboard/payroll-holds',
        }),
      );
    });

    it('does not notify when the employee has no linked user', async () => {
      const processor = mockProcessor();
      const prisma = {
        payrollHold: {
          findUnique: jest
            .fn()
            .mockResolvedValue({ id: 'hold-1', employeeId: 'emp-hold-1' }),
        },
        employee: {
          findUnique: jest.fn().mockResolvedValue({ userId: null }),
        },
      };
      const notificationsService = mockNotificationsService();

      const { GovernanceNotificationListener } =
        await import('./governance-notification.listener');
      const listener = new GovernanceNotificationListener(
        processor as never,
        prisma as never,
        notificationsService as never,
      );

      await listener.handlePayrollHoldReleaseRequested(
        createDomainEvent(
          DomainEventTypes.PAYROLL_HOLD_RELEASE_REQUESTED,
          'hold-1',
          'PAYROLL_HOLD',
        ),
      );

      expect(notificationsService.create).not.toHaveBeenCalled();
    });
  });
});
