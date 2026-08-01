import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateExtensionDto } from './dto/tasks.dto';
import { ApprovalsSpawningService } from '../approvals';
import { ApprovalStatus } from '@prisma/client';

@Injectable()
export class TaskExtensionService {
  private readonly logger = new Logger(TaskExtensionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly spawningService: ApprovalsSpawningService,
  ) {}

  async requestExtension(
    companyId: string,
    taskId: string,
    actorId: string,
    dto: CreateExtensionDto,
  ) {
    const actor = await this.prisma.employee.findFirst({
      where: { userId: actorId, companyId },
    });
    if (!actor) throw new BadRequestException('Actor not found.');

    const newDueDate = new Date(dto.requestedDueDate);

    return await this.prisma.$transaction(async (tx) => {
      const task = await tx.task.findFirst({
        where: { id: taskId, companyId },
      });
      if (!task) throw new BadRequestException('Task not found.');
      if (newDueDate <= task.dueDate) {
        throw new BadRequestException(
          'Requested due date must be later than the current due date.',
        );
      }

      // Single PENDING Extension Constraint
      const existingPending = await tx.taskExtension.findFirst({
        where: { taskId, status: ApprovalStatus.PENDING },
      });
      if (existingPending) {
        throw new BadRequestException(
          'A Task may only have one PENDING TaskExtension at any time.',
        );
      }

      const extension = await tx.taskExtension.create({
        data: {
          taskId,
          companyId,
          requestedDueDate: newDueDate,
          reason: dto.reason,
          status: ApprovalStatus.PENDING,
        },
      });

      // Spawn Approval Request — resolve creator Employee ID to User ID for proper manager resolution
      const creatorEmployee = await this.prisma.employee.findUnique({
        where: { id: task.creatorId },
        select: { userId: true },
      });
      const approvalReq = await this.spawningService.spawnRequest(
        companyId,
        'TASK_EXTENSION',
        extension.id,
        creatorEmployee?.userId || actorId, // Fallback to requesting actor if creator not found
      );

      await tx.taskExtension.update({
        where: { id: extension.id },
        data: { approvalId: approvalReq.id },
      });

      await tx.taskHistory.create({
        data: {
          taskId,
          companyId,
          actorId: actor.id,
          event: 'EXTENSION_REQUESTED',
          comments: `Extension requested to ${dto.requestedDueDate}. Reason: ${dto.reason}`,
        },
      });

      return extension;
    });
  }

  // This method would be called by the Approval Engine when a request is fully approved or rejected
  async processExtensionOutcome(approvalId: string, status: ApprovalStatus) {
    const extension = await this.prisma.taskExtension.findFirst({
      where: { approvalId, status: ApprovalStatus.PENDING },
      include: { tasks: true },
    });

    if (!extension) return;

    await this.prisma.$transaction(async (tx) => {
      await tx.taskExtension.update({
        where: { id: extension.id },
        data: { status },
      });

      if (status === ApprovalStatus.APPROVED) {
        await tx.task.update({
          where: { id: extension.taskId },
          data: { dueDate: extension.requestedDueDate },
        });

        await tx.taskHistory.create({
          data: {
            taskId: extension.taskId,
            companyId: extension.tasks.companyId,
            event: 'EXTENSION_APPROVED',
            comments: `Task due date extended to ${extension.requestedDueDate.toISOString()}`,
          },
        });
      } else if (status === ApprovalStatus.REJECTED) {
        await tx.taskHistory.create({
          data: {
            taskId: extension.taskId,
            companyId: extension.tasks.companyId,
            event: 'EXTENSION_REJECTED',
            comments: `Task extension request was rejected.`,
          },
        });
      }
    });
  }
}
