import { Injectable, BadRequestException, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { TransitionService } from '../../common/services/transition.service';
import { SubmitProofDto, ReviewProofDto } from './dto/tasks.dto';
import {
  TaskStatus,
  ApprovalStatus,
  TaskCompletionApprovalStatus,
} from '@prisma/client';
import { GovernanceEventPublisher } from '../governance-events/governance-event.publisher';
import { DomainEventTypes } from '../governance-events/types/events';

@Injectable()
export class TaskProofService {
  private readonly logger = new Logger(TaskProofService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly transitionService: TransitionService,
    @Optional() private readonly eventPublisher?: GovernanceEventPublisher,
  ) {}

  async submitProof(
    companyId: string,
    taskId: string,
    actorId: string,
    dto: SubmitProofDto,
  ) {
    const actor = await this.prisma.employee.findFirst({
      where: { userId: actorId, companyId },
    });
    if (!actor) throw new BadRequestException('Employee not found.');

    return await this.prisma.$transaction(async (tx) => {
      const task = await tx.task.findFirst({
        where: { id: taskId, companyId, assigneeId: actor.id },
      });
      if (!task)
        throw new BadRequestException(
          'Task not found or you are not the assignee.',
        );
      if (
        task.status !== TaskStatus.IN_PROGRESS &&
        task.status !== TaskStatus.OVERDUE
      ) {
        throw new BadRequestException('Task is not in a submittable state.');
      }

      this.transitionService.validate(
        'Task',
        task.status,
        TaskStatus.PENDING_VALIDATION,
      );

      // Check 3-Strike Circuit Breaker
      const rejectedProofs = await tx.taskProof.count({
        where: { taskId, status: ApprovalStatus.REJECTED },
      });

      let isHrRouting = false;
      if (rejectedProofs >= 2) {
        isHrRouting = true;
      }

      const proof = await tx.taskProof.create({
        data: {
          taskId,
          companyId,
          submissionUrl: dto.submissionUrl,
          comments: dto.comments,
          status: ApprovalStatus.PENDING,
          // reviewerId is left null to indicate it needs dynamic role-based resolution at review time
        },
      });

      await tx.task.update({
        where: { id: taskId },
        data: { status: TaskStatus.PENDING_VALIDATION },
      });

      await tx.taskCompletionApproval.upsert({
        where: { taskId },
        create: {
          companyId,
          taskId,
          proofId: proof.id,
          status: TaskCompletionApprovalStatus.PENDING,
        },
        update: {
          proofId: proof.id,
          status: TaskCompletionApprovalStatus.PENDING,
          managerAcknowledgedAt: null,
          ownerApprovedAt: null,
        },
      });

      const eventStr = isHrRouting
        ? 'PROOF_SUBMITTED_ESCALATED_HR'
        : 'PROOF_SUBMITTED';
      const commentStr = isHrRouting
        ? '3-Strike Circuit Breaker activated. Validation routed to HR.'
        : 'Task proof submitted to Manager for validation.';

      await tx.taskHistory.create({
        data: {
          taskId,
          companyId,
          actorId: actor.id,
          event: eventStr,
          comments: commentStr,
        },
      });

      return proof;
    });
  }

  /**
   * Tier 1 of the two-tier completion sign-off (§7.10).
   * The assignee's manager (or a manager/HR/owner delegate) confirms the
   * submitted proof is genuine. The task remains PENDING_VALIDATION until the
   * Owner performs the distinct "Approve completion" action.
   */
  async acknowledgeCompletion(
    companyId: string,
    proofId: string,
    actorId: string,
    dto: ReviewProofDto,
  ) {
    const actor = await this.prisma.employee.findFirst({
      where: { userId: actorId, companyId },
    });
    if (!actor) throw new BadRequestException('Reviewer not found.');

    return await this.prisma.$transaction(async (tx) => {
      const proof = await tx.taskProof.findFirst({
        where: { id: proofId, status: ApprovalStatus.PENDING },
        include: { tasks: true },
      });
      if (!proof) throw new BadRequestException('Pending proof not found.');

      const approval = await tx.taskCompletionApproval.upsert({
        where: { taskId: proof.taskId },
        create: {
          companyId,
          taskId: proof.taskId,
          proofId: proof.id,
          status: TaskCompletionApprovalStatus.MANAGER_ACKNOWLEDGED,
          managerId: actor.id,
          managerAcknowledgedAt: new Date(),
          comments: dto.comments,
        },
        update: {
          status: TaskCompletionApprovalStatus.MANAGER_ACKNOWLEDGED,
          managerId: actor.id,
          managerAcknowledgedAt: new Date(),
          comments: dto.comments,
        },
      });

      await tx.taskHistory.create({
        data: {
          taskId: proof.taskId,
          companyId,
          actorId: actor.id,
          event: 'PROOF_ACKNOWLEDGED_BY_MANAGER',
          comments: dto.comments || 'Completion acknowledged by manager.',
        },
      });

      await this.eventPublisher?.publish(tx, {
        eventType: DomainEventTypes.TASK_COMPLETION_ACKNOWLEDGED,
        entityId: proof.taskId,
        entityType: 'Task',
        companyId,
        payload: {
          companyId,
          taskId: proof.taskId,
          proofId: proof.id,
          approvalId: approval.id,
        },
      });

      return {
        success: true,
        message: 'Completion acknowledged by manager. Awaiting Owner approval.',
      };
    });
  }

  /**
   * Tier 2 of the two-tier completion sign-off (§7.10).
   * The Owner performs the distinct "Approve completion" action. Only allowed
   * after a manager has acknowledged the completion.
   */
  async approveCompletion(
    companyId: string,
    proofId: string,
    actorId: string,
    dto: ReviewProofDto,
  ) {
    const actor = await this.prisma.employee.findFirst({
      where: { userId: actorId, companyId },
    });
    if (!actor) throw new BadRequestException('Reviewer not found.');

    return await this.prisma.$transaction(async (tx) => {
      const proof = await tx.taskProof.findFirst({
        where: { id: proofId },
        include: { tasks: true },
      });
      if (!proof) throw new BadRequestException('Proof not found.');

      const approval = await tx.taskCompletionApproval.findFirst({
        where: { taskId: proof.taskId },
      });
      if (
        !approval ||
        approval.status !== TaskCompletionApprovalStatus.MANAGER_ACKNOWLEDGED
      ) {
        throw new BadRequestException(
          'Completion must be acknowledged by a manager before Owner approval.',
        );
      }

      this.transitionService.validate(
        'Task',
        proof.tasks.status,
        TaskStatus.COMPLETED,
      );

      await tx.taskProof.update({
        where: { id: proofId },
        data: {
          status: ApprovalStatus.APPROVED,
          reviewerId: actor.id,
          reviewedAt: new Date(),
          reviewerComments: dto.comments,
        },
      });

      await tx.task.update({
        where: { id: proof.taskId },
        data: { status: TaskStatus.COMPLETED },
      });

      await tx.taskCompletionApproval.update({
        where: { id: approval.id },
        data: {
          status: TaskCompletionApprovalStatus.APPROVED,
          ownerId: actor.id,
          ownerApprovedAt: new Date(),
          comments: dto.comments,
        },
      });

      await tx.taskHistory.create({
        data: {
          taskId: proof.taskId,
          companyId,
          actorId: actor.id,
          event: 'PROOF_APPROVED_BY_OWNER',
          comments: dto.comments || 'Completion approved by Owner.',
        },
      });

      await this.eventPublisher?.publish(tx, {
        eventType: DomainEventTypes.TASK_COMPLETION_APPROVED,
        entityId: proof.taskId,
        entityType: 'Task',
        companyId,
        payload: {
          companyId,
          taskId: proof.taskId,
          proofId: proof.id,
          approvalId: approval.id,
        },
      });

      // Keep existing downstream behavior (creator notification, hold release).
      await this.eventPublisher?.publish(tx, {
        eventType: DomainEventTypes.TASK_COMPLETED,
        entityId: proof.taskId,
        entityType: 'Task',
        companyId,
        payload: {
          companyId,
          taskId: proof.taskId,
        },
      });

      return { success: true, message: 'Completion approved by Owner' };
    });
  }

  /**
   * Reject the completion at either tier. The task returns to IN_PROGRESS.
   */
  async rejectCompletion(
    companyId: string,
    proofId: string,
    actorId: string,
    dto: ReviewProofDto,
  ) {
    const actor = await this.prisma.employee.findFirst({
      where: { userId: actorId, companyId },
    });
    if (!actor) throw new BadRequestException('Reviewer not found.');

    return await this.prisma.$transaction(async (tx) => {
      const proof = await tx.taskProof.findFirst({
        where: { id: proofId, status: ApprovalStatus.PENDING },
        include: { tasks: true },
      });
      if (!proof) throw new BadRequestException('Pending proof not found.');

      this.transitionService.validate(
        'Task',
        proof.tasks.status,
        TaskStatus.IN_PROGRESS,
      );

      await tx.taskProof.update({
        where: { id: proofId },
        data: {
          status: ApprovalStatus.REJECTED,
          reviewerId: actor.id,
          reviewedAt: new Date(),
          reviewerComments: dto.comments,
        },
      });

      await tx.task.update({
        where: { id: proof.taskId },
        data: { status: TaskStatus.IN_PROGRESS },
      });

      await tx.taskCompletionApproval.update({
        where: { taskId: proof.taskId },
        data: { status: TaskCompletionApprovalStatus.REJECTED },
      });

      await tx.taskHistory.create({
        data: {
          taskId: proof.taskId,
          companyId,
          actorId: actor.id,
          event: 'PROOF_REJECTED',
          comments: dto.comments || 'Proof rejected.',
        },
      });

      await this.eventPublisher?.publish(tx, {
        eventType: DomainEventTypes.TASK_PROOF_REJECTED,
        entityId: proof.taskId,
        entityType: 'Task',
        companyId,
        payload: {
          companyId,
          taskId: proof.taskId,
          proofId: proof.id,
        },
      });

      return { success: true, message: 'Proof rejected' };
    });
  }
}
