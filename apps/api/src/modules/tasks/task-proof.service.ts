import { Injectable, BadRequestException, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { TransitionService } from '../../common/services/transition.service';
import { SubmitProofDto, ReviewProofDto } from './dto/tasks.dto';
import { TaskStatus, ApprovalStatus } from '@prisma/client';
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

  async reviewProof(
    companyId: string,
    proofId: string,
    actorId: string,
    action: 'APPROVE' | 'REJECT',
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

      // RBAC for who can review this is handled by the Controller / PermissionsGuard
      // This service assumes the caller is authorized.

      const newProofStatus =
        action === 'APPROVE'
          ? ApprovalStatus.APPROVED
          : ApprovalStatus.REJECTED;
      const newTaskStatus =
        action === 'APPROVE' ? TaskStatus.COMPLETED : TaskStatus.IN_PROGRESS;

      // Validate task status transition
      this.transitionService.validate(
        'Task',
        proof.tasks.status,
        newTaskStatus,
      );

      await tx.taskProof.update({
        where: { id: proofId },
        data: {
          status: newProofStatus,
          reviewerId: actor.id,
          reviewedAt: new Date(),
          reviewerComments: dto.comments,
        },
      });

      await tx.task.update({
        where: { id: proof.taskId },
        data: { status: newTaskStatus },
      });

      await tx.taskHistory.create({
        data: {
          taskId: proof.taskId,
          companyId,
          actorId: actor.id,
          event: action === 'APPROVE' ? 'PROOF_APPROVED' : 'PROOF_REJECTED',
          comments:
            dto.comments || `Proof ${action.toLowerCase()} by reviewer.`,
        },
      });

      if (action === 'APPROVE') {
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
      }

      return { success: true, message: `Proof ${action}` };
    });
  }
}
