import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateTaskDto, ReassignTaskDto } from './dto/tasks.dto';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { GovernanceEventPublisher } from '../governance-events/governance-event.publisher';
import { DomainEventTypes } from '../governance-events/types/events';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly eventPublisher?: GovernanceEventPublisher,
  ) {}

  private validateDueDateSla(
    priority: TaskPriority,
    dueDate: Date,
    override: boolean = false,
  ) {
    if (override) return;

    const now = new Date();
    const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    let requiredHours = 24;
    if (priority === TaskPriority.CRITICAL) requiredHours = 4;
    else if (priority === TaskPriority.IMPORTANT) requiredHours = 12;

    if (diffHours < requiredHours) {
      throw new BadRequestException(
        `Due date SLA violated. Priority ${priority} requires at least ${requiredHours} hours.`,
      );
    }
  }

  async createTask(
    companyId: string,
    creatorId: string,
    dto: CreateTaskDto,
    isOwner: boolean,
  ) {
    const dueDate = new Date(dto.dueDate);

    const now = new Date();
    // Compute SLA deadline if slaHours is provided
    let slaDeadline: Date | null = null;
    if (dto.slaHours) {
      slaDeadline = new Date(now.getTime() + dto.slaHours * 60 * 60 * 1000);
      // If both slaHours and dueDate set, use the earlier deadline
      if (dueDate < slaDeadline) {
        slaDeadline = dueDate;
      }
    }

    // Resolve creator employee ID
    const creator = await this.prisma.employee.findFirst({
      where: { userId: creatorId, companyId },
    });
    if (!creator)
      throw new BadRequestException('Creator employee profile not found.');

    if (!dto.slaHours) {
      this.validateDueDateSla(dto.priority, dueDate, isOwner);
    }

    return await this.prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          companyId,
          creatorId: creator.id,
          assigneeId: dto.assigneeId,
          category: dto.category,
          title: dto.title,
          description: dto.description,
          priority: dto.priority,
          dueDate,
          status: TaskStatus.PENDING,
          slaHours: dto.slaHours || null,
          slaDeadline: slaDeadline,
        },
      });

      await tx.taskHistory.create({
        data: {
          taskId: task.id,
          companyId,
          actorId: creator.id,
          event: 'TASK_CREATED',
          comments: `Task created and assigned.`,
        },
      });

      await this.eventPublisher?.publish(tx, {
        eventType: DomainEventTypes.TASK_CREATED,
        entityId: task.id,
        entityType: 'Task',
        companyId,
        payload: {
          companyId,
          taskId: task.id,
          assigneeId: task.assigneeId,
          priority: task.priority,
          dueDate: task.dueDate.toISOString(),
          slaHours: dto.slaHours || null,
          slaDeadline: slaDeadline?.toISOString() || null,
        },
      });

      return task;
    });
  }

  async reassignTask(
    companyId: string,
    taskId: string,
    actorId: string,
    dto: ReassignTaskDto,
  ) {
    const actor = await this.prisma.employee.findFirst({
      where: { userId: actorId, companyId },
    });

    return await this.prisma.$transaction(async (tx) => {
      const task = await tx.task.findFirst({
        where: { id: taskId, companyId },
      });
      if (!task) throw new NotFoundException('Task not found.');
      if (task.status === TaskStatus.COMPLETED)
        throw new BadRequestException('Cannot reassign completed task.');

      const updated = await tx.task.update({
        where: { id: taskId },
        data: {
          assigneeId: dto.newAssigneeId,
          acknowledgedAt: null, // Reset acknowledgment
          status: TaskStatus.PENDING,
        },
      });

      await tx.taskHistory.create({
        data: {
          taskId,
          companyId,
          actorId: actor?.id,
          event: 'TASK_REASSIGNED',
          comments: dto.comments || 'Task reassigned.',
        },
      });

      return updated;
    });
  }

  async cancelTask(companyId: string, taskId: string, actorId: string) {
    const actor = await this.prisma.employee.findFirst({
      where: { userId: actorId, companyId },
    });

    return await this.prisma.$transaction(async (tx) => {
      const task = await tx.task.findFirst({
        where: { id: taskId, companyId },
      });
      if (!task) throw new NotFoundException('Task not found');

      if (task.status === TaskStatus.CANCELLED) {
        throw new BadRequestException('Task is already cancelled.');
      }
      if (task.status === TaskStatus.COMPLETED) {
        throw new BadRequestException('Cannot cancel a completed task.');
      }

      const updated = await tx.task.update({
        where: { id: taskId },
        data: { status: TaskStatus.CANCELLED },
      });

      await tx.taskHistory.create({
        data: {
          taskId,
          companyId,
          event: 'TASK_CANCELLED',
          actorId: actor?.id ?? null,
          comments: 'Task cancelled by operator',
        },
      });

      return updated;
    });
  }

  async acknowledgeTask(companyId: string, taskId: string, actorId: string) {
    const actor = await this.prisma.employee.findFirst({
      where: { userId: actorId, companyId },
    });

    return await this.prisma.$transaction(async (tx) => {
      const task = await tx.task.findFirst({
        where: { id: taskId, companyId, status: TaskStatus.PENDING },
      });

      if (!task)
        throw new BadRequestException(
          'Task not found or not in PENDING state.',
        );
      if (actor && task.assigneeId !== actor.id) {
        throw new BadRequestException(
          'Only the assignee can acknowledge the task.',
        );
      }

      const updated = await tx.task.update({
        where: { id: taskId },
        data: {
          acknowledgedAt: new Date(),
          status: TaskStatus.IN_PROGRESS,
        },
      });

      await tx.taskHistory.create({
        data: {
          taskId,
          companyId,
          actorId: actor?.id,
          event: 'TASK_ACKNOWLEDGED',
          comments: 'Task acknowledged by assignee.',
        },
      });

      return updated;
    });
  }

  async findAll(companyId: string, query: any) {
    const { page = 1, limit = 10, status, priority, assigneeId, category, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      companyId,
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(assigneeId ? { assigneeId } : {}),
      ...(category ? { category } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          employeesTasksAssigneeIdToemployees: true,
          employeesTasksCreatorIdToemployees: true,
          taskCompletionApprovals: true,
          taskProofs: {
            where: { deletedAt: null },
            orderBy: { submittedAt: 'desc' },
          },
        },
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async findMyTasks(companyId: string, userId: string, query: any) {
    const employee = await this.prisma.employee.findFirst({
      where: { userId, companyId },
    });
    if (!employee) throw new BadRequestException('Employee profile not found.');

    query.assigneeId = employee.id;
    return this.findAll(companyId, query);
  }

  async findOne(companyId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, companyId },
      include: {
        employeesTasksAssigneeIdToemployees: true,
        employeesTasksCreatorIdToemployees: true,
        taskHistories: {
          orderBy: { createdAt: 'desc' },
          include: { employees: true },
        },
        taskProofs: {
          orderBy: { submittedAt: 'desc' },
        },
        taskCompletionApprovals: true,
      },
    });

    if (!task) throw new NotFoundException('Task not found');
    return task;
  }
}
