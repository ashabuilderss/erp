import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { TasksService } from './tasks.service';
import { CreateTaskDto, ReassignTaskDto } from './dto/tasks.dto';
import { DomainEventTypes } from '../governance-events/types/events';

describe('TasksService', () => {
  let service: TasksService;
  let mockPrisma: any;
  let mockEventPublisher: any;

  const mockCompanyId = 'company-1';
  const mockCreatorId = 'user-1';
  const mockActorId = 'user-2';
  const mockTaskId = 'task-1';

  const mockEmployee = { id: 'emp-1', userId: 'user-1', companyId: mockCompanyId };
  const mockActorEmployee = { id: 'emp-2', userId: 'user-2', companyId: mockCompanyId };
  const mockAssigneeEmployee = { id: 'emp-3', userId: 'user-3', companyId: mockCompanyId };

  const mockTask = {
    id: mockTaskId,
    companyId: mockCompanyId,
    creatorId: mockEmployee.id,
    assigneeId: mockAssigneeEmployee.id,
    category: 'COMPLIANCE',
    title: 'Test Task',
    description: 'A test task',
    priority: TaskPriority.IMPORTANT,
    dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
    status: TaskStatus.PENDING,
    slaHours: null,
    slaDeadline: null,
    acknowledgedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockHistory = {
    id: 'hist-1',
    taskId: mockTaskId,
    companyId: mockCompanyId,
    actorId: mockEmployee.id,
    event: 'TASK_CREATED',
    comments: 'Task created and assigned.',
  };

  const mockTx = {
    task: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    taskHistory: { create: jest.fn() },
    domainEvent: { create: jest.fn() },
  };

  beforeEach(() => {
    mockEventPublisher = { publish: jest.fn() };
    mockPrisma = {
      $transaction: jest.fn().mockImplementation(async (cb: any) => cb(mockTx)),
      employee: { findFirst: jest.fn() },
      task: { findMany: jest.fn(), findFirst: jest.fn(), count: jest.fn() },
    };
    Object.values(mockTx).forEach((model: any) => {
      if (model.create) model.create.mockReset();
      if (model.findFirst) model.findFirst.mockReset();
      if (model.update) model.update.mockReset();
    });
    service = new TasksService(mockPrisma, mockEventPublisher);
  });

  describe('createTask', () => {
    const createDto: CreateTaskDto = {
      assigneeId: mockAssigneeEmployee.id,
      category: 'COMPLIANCE' as any,
      title: 'Test Task',
      description: 'A test task',
      priority: TaskPriority.IMPORTANT,
      dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    };

    it('creates a task successfully with SLA hours', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue(mockEmployee);
      mockTx.task.create.mockResolvedValue(mockTask);
      mockTx.taskHistory.create.mockResolvedValue(mockHistory);

      const dto = { ...createDto, slaHours: 24 };
      const result = await service.createTask(mockCompanyId, mockCreatorId, dto, false);

      expect(result).toEqual(mockTask);
      expect(mockTx.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ companyId: mockCompanyId, slaHours: 24 }),
        }),
      );
      expect(mockTx.taskHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ event: 'TASK_CREATED' }) }),
      );
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(mockTx, {
        eventType: DomainEventTypes.TASK_CREATED,
        entityId: mockTask.id,
        entityType: 'Task',
        companyId: mockCompanyId,
        payload: expect.objectContaining({ taskId: mockTask.id, slaHours: 24 }),
      });
    });

    it('throws when creator employee not found', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue(null);

      await expect(
        service.createTask(mockCompanyId, mockCreatorId, createDto, false),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when due date violates SLA for CRITICAL priority', async () => {
      const closeDue = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      const dto = { ...createDto, dueDate: closeDue, priority: TaskPriority.CRITICAL };
      mockPrisma.employee.findFirst.mockResolvedValue(mockEmployee);

      await expect(
        service.createTask(mockCompanyId, mockCreatorId, dto, false),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('reassignTask', () => {
    const reassignDto: ReassignTaskDto = { newAssigneeId: 'emp-4', comments: 'Reassigning' };

    it('reassigns task successfully', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue(mockActorEmployee);
      mockTx.task.findFirst.mockResolvedValue(mockTask);
      const updated = { ...mockTask, assigneeId: 'emp-4', status: TaskStatus.PENDING, acknowledgedAt: null };
      mockTx.task.update.mockResolvedValue(updated);

      const result = await service.reassignTask(mockCompanyId, mockTaskId, mockActorId, reassignDto);

      expect(result).toEqual(updated);
      expect(mockTx.task.update).toHaveBeenCalledWith({
        where: { id: mockTaskId },
        data: { assigneeId: 'emp-4', acknowledgedAt: null, status: TaskStatus.PENDING },
      });
    });

    it('throws when task is completed', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue(mockActorEmployee);
      mockTx.task.findFirst.mockResolvedValue({ ...mockTask, status: TaskStatus.COMPLETED });

      await expect(
        service.reassignTask(mockCompanyId, mockTaskId, mockActorId, reassignDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelTask', () => {
    it('cancels task successfully', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue(mockActorEmployee);
      mockTx.task.findFirst.mockResolvedValue(mockTask);
      const cancelled = { ...mockTask, status: TaskStatus.CANCELLED };
      mockTx.task.update.mockResolvedValue(cancelled);

      const result = await service.cancelTask(mockCompanyId, mockTaskId, mockActorId);

      expect(result).toEqual(cancelled);
      expect(mockTx.task.update).toHaveBeenCalledWith({
        where: { id: mockTaskId },
        data: { status: TaskStatus.CANCELLED },
      });
    });

    it('throws when already cancelled', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue(mockActorEmployee);
      mockTx.task.findFirst.mockResolvedValue({ ...mockTask, status: TaskStatus.CANCELLED });

      await expect(
        service.cancelTask(mockCompanyId, mockTaskId, mockActorId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('acknowledgeTask', () => {
    it('acknowledges task successfully', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue(mockActorEmployee);
      const pending = { ...mockTask, assigneeId: mockActorEmployee.id, status: TaskStatus.PENDING };
      mockTx.task.findFirst.mockResolvedValue(pending);
      mockTx.task.update.mockResolvedValue({ ...pending, status: TaskStatus.IN_PROGRESS, acknowledgedAt: new Date() });

      const result = await service.acknowledgeTask(mockCompanyId, mockTaskId, mockActorId);

      expect(result.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('throws when actor is not the assignee', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue(mockActorEmployee);
      const pending = { ...mockTask, assigneeId: 'other-emp', status: TaskStatus.PENDING };
      mockTx.task.findFirst.mockResolvedValue(pending);

      await expect(
        service.acknowledgeTask(mockCompanyId, mockTaskId, mockActorId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('returns paginated tasks with default pagination', async () => {
      mockPrisma.task.findMany.mockResolvedValue([mockTask]);
      mockPrisma.task.count.mockResolvedValue(1);

      const result = await service.findAll(mockCompanyId, {});

      expect(result.items).toHaveLength(1);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 10, totalPages: 1 });
    });

    it('applies status and priority filters', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.task.count.mockResolvedValue(0);

      await service.findAll(mockCompanyId, { status: TaskStatus.PENDING, priority: TaskPriority.CRITICAL });

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: TaskStatus.PENDING, priority: TaskPriority.CRITICAL }),
        }),
      );
    });
  });

  describe('findMyTasks', () => {
    it('resolves employee and delegates to findAll', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue(mockEmployee);
      mockPrisma.task.findMany.mockResolvedValue([mockTask]);
      mockPrisma.task.count.mockResolvedValue(1);

      const result = await service.findMyTasks(mockCompanyId, mockCreatorId, {});

      expect(result.items).toHaveLength(1);
    });

    it('throws when employee not found', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue(null);

      await expect(
        service.findMyTasks(mockCompanyId, 'unknown', {}),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('returns task with histories and proofs', async () => {
      const fullTask = { ...mockTask, taskHistories: [], taskProofs: [] };
      mockPrisma.task.findFirst.mockResolvedValue(fullTask);

      const result = await service.findOne(mockCompanyId, mockTaskId);

      expect(result).toEqual(fullTask);
    });

    it('throws NotFoundException when task not found', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(null);

      await expect(service.findOne(mockCompanyId, 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
