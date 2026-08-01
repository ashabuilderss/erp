import { BadRequestException } from '@nestjs/common';
import { TaskStatus, ApprovalStatus, TaskCompletionApprovalStatus } from '@prisma/client';
import { TaskProofService } from './task-proof.service';
import { DomainEventTypes } from '../governance-events/types/events';

describe('TaskProofService - two-tier completion sign-off (SRS 7.10)', () => {
  let service: TaskProofService;
  let mockPrisma: any;
  let mockTransitionService: any;
  let mockEventPublisher: any;

  const mockCompanyId = 'company-1';
  const mockActorId = 'user-manager';
  const mockOwnerId = 'user-owner';
  const mockTaskId = 'task-1';
  const mockProofId = 'proof-1';

  const mockEmployee = { id: 'emp-manager', userId: mockActorId, companyId: mockCompanyId };
  const mockOwnerEmployee = { id: 'emp-owner', userId: mockOwnerId, companyId: mockCompanyId };

  const mockProof = {
    id: mockProofId,
    taskId: mockTaskId,
    companyId: mockCompanyId,
    status: ApprovalStatus.PENDING,
    tasks: {
      id: mockTaskId,
      status: TaskStatus.PENDING_VALIDATION,
    },
  };

  const mockApproval = {
    id: 'approval-1',
    taskId: mockTaskId,
    status: TaskCompletionApprovalStatus.MANAGER_ACKNOWLEDGED,
  };

  beforeEach(() => {
    mockEventPublisher = { publish: jest.fn() };
    mockTransitionService = { validate: jest.fn() };
    mockPrisma = {
      $transaction: jest.fn().mockImplementation(async (cb: any) => cb(mockTx)),
      employee: { findFirst: jest.fn() },
    };
    service = new TaskProofService(mockPrisma, mockTransitionService, mockEventPublisher);
  });

  const mockTx = {
    taskProof: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn(), count: jest.fn() },
    task: { update: jest.fn(), findFirst: jest.fn() },
    taskCompletionApproval: { upsert: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    taskHistory: { create: jest.fn() },
    domainEvent: { create: jest.fn() },
  };

  it('acknowledgeCompletion: manager acknowledges a pending proof (tier 1)', async () => {
    mockPrisma.employee.findFirst.mockResolvedValue(mockEmployee);
    mockTx.taskProof.findFirst.mockResolvedValue(mockProof);
    mockTx.taskCompletionApproval.upsert.mockResolvedValue({
      ...mockApproval,
      status: TaskCompletionApprovalStatus.MANAGER_ACKNOWLEDGED,
    });

    const result = await service.acknowledgeCompletion(
      mockCompanyId,
      mockProofId,
      mockActorId,
      { comments: 'Looks good' },
    );

    expect(result.success).toBe(true);
    expect(mockTx.taskCompletionApproval.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { taskId: mockTaskId },
        create: expect.objectContaining({
          status: TaskCompletionApprovalStatus.MANAGER_ACKNOWLEDGED,
          managerId: mockEmployee.id,
          managerAcknowledgedAt: expect.any(Date),
        }),
      }),
    );
    // Tier 1 must NOT complete the task.
    expect(mockTx.task.update).not.toHaveBeenCalled();
    // It emits the acknowledge event so the Owner gets the approve action.
    expect(mockEventPublisher.publish).toHaveBeenCalledWith(
      mockTx,
      expect.objectContaining({
        eventType: DomainEventTypes.TASK_COMPLETION_ACKNOWLEDGED,
        entityId: mockTaskId,
      }),
    );
  });

  it('approveCompletion: rejects when not acknowledged by a manager (tier 2 gate)', async () => {
    mockPrisma.employee.findFirst.mockResolvedValue(mockOwnerEmployee);
    mockTx.taskProof.findFirst.mockResolvedValue(mockProof);
    mockTx.taskCompletionApproval.findFirst.mockResolvedValue({
      id: 'approval-1',
      taskId: mockTaskId,
      status: TaskCompletionApprovalStatus.PENDING,
    });

    await expect(
      service.approveCompletion(mockCompanyId, mockProofId, mockOwnerId, {}),
    ).rejects.toThrow(BadRequestException);

    expect(mockTx.task.update).not.toHaveBeenCalled();
    expect(mockEventPublisher.publish).not.toHaveBeenCalled();
  });

  it('approveCompletion: owner approves after manager acknowledgment (tier 2)', async () => {
    mockPrisma.employee.findFirst.mockResolvedValue(mockOwnerEmployee);
    mockTx.taskProof.findFirst.mockResolvedValue(mockProof);
    mockTx.taskCompletionApproval.findFirst.mockResolvedValue(mockApproval);

    const result = await service.approveCompletion(
      mockCompanyId,
      mockProofId,
      mockOwnerId,
      { comments: 'Approved by Owner' },
    );

    expect(result.success).toBe(true);
    expect(mockTransitionService.validate).toHaveBeenCalledWith(
      'Task',
      TaskStatus.PENDING_VALIDATION,
      TaskStatus.COMPLETED,
    );
    expect(mockTx.taskProof.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockProofId },
        data: expect.objectContaining({
          status: ApprovalStatus.APPROVED,
          reviewerId: mockOwnerEmployee.id,
        }),
      }),
    );
    expect(mockTx.task.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockTaskId },
        data: { status: TaskStatus.COMPLETED },
      }),
    );
    expect(mockTx.taskCompletionApproval.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockApproval.id },
        data: expect.objectContaining({
          status: TaskCompletionApprovalStatus.APPROVED,
          ownerId: mockOwnerEmployee.id,
          ownerApprovedAt: expect.any(Date),
        }),
      }),
    );
    // Emits both the new approval event and the existing TASK_COMPLETED event.
    const events = mockEventPublisher.publish.mock.calls.map((c: any) => c[1].eventType);
    expect(events).toContain(DomainEventTypes.TASK_COMPLETION_APPROVED);
    expect(events).toContain(DomainEventTypes.TASK_COMPLETED);
  });

  it('rejectCompletion: rejects proof and returns task to IN_PROGRESS', async () => {
    mockPrisma.employee.findFirst.mockResolvedValue(mockEmployee);
    mockTx.taskProof.findFirst.mockResolvedValue(mockProof);

    const result = await service.rejectCompletion(
      mockCompanyId,
      mockProofId,
      mockActorId,
      { comments: 'Insufficient evidence' },
    );

    expect(result.success).toBe(true);
    expect(mockTx.taskProof.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockProofId },
        data: expect.objectContaining({ status: ApprovalStatus.REJECTED }),
      }),
    );
    expect(mockTx.task.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockTaskId },
        data: { status: TaskStatus.IN_PROGRESS },
      }),
    );
    expect(mockEventPublisher.publish).toHaveBeenCalledWith(
      mockTx,
      expect.objectContaining({
        eventType: DomainEventTypes.TASK_PROOF_REJECTED,
      }),
    );
  });

  it('submitProof: creates a pending TaskCompletionApproval record', async () => {
    const assignee = { id: 'emp-assignee', userId: 'user-assignee', companyId: mockCompanyId };
    const pendingTask = {
      id: mockTaskId,
      companyId: mockCompanyId,
      assigneeId: assignee.id,
      status: TaskStatus.IN_PROGRESS,
    };
    const newProof = { id: mockProofId, taskId: mockTaskId };
    mockPrisma.employee.findFirst.mockResolvedValue(assignee);
    mockTx.task.findFirst.mockResolvedValue(pendingTask);
    mockTx.taskProof.create.mockResolvedValue(newProof);
    mockTx.taskProof.count.mockResolvedValue(0);

    await service.submitProof(mockCompanyId, mockTaskId, 'user-assignee', {
      submissionUrl: 'https://example.com/proof.jpg',
      comments: 'Done',
    });

    expect(mockTx.taskCompletionApproval.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { taskId: mockTaskId },
        create: expect.objectContaining({
          status: TaskCompletionApprovalStatus.PENDING,
          proofId: mockProofId,
        }),
      }),
    );
    expect(mockTx.task.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockTaskId },
        data: { status: TaskStatus.PENDING_VALIDATION },
      }),
    );
  });
});
