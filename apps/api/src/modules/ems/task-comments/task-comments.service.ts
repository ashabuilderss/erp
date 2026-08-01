import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import { TransitionService } from '../../../common/services/transition.service';
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';
import { Prisma, UserRole } from '@prisma/client';

@Injectable()
export class TaskCommentsService {
  constructor(
    private prisma: PrismaService,
    private readonly transitionService: TransitionService,
  ) {}

  async findByAssignment(
    assignmentId: string,
    companyId: string,
    employeeId: string,
    role: string,
  ) {
    const where: Prisma.TaskCommentWhereInput = {
      assignmentId,
      companyId,
      deletedAt: null,
    };

    if (role !== UserRole.ADMIN) {
      where.OR = [{ isPrivate: false }, { authorId: employeeId }];
    }

    return this.prisma.taskComment.findMany({
      where,
      include: {
        employees: { include: { users: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(dto: CreateTaskCommentDto, companyId: string, authorId: string) {
    return this.prisma.taskComment.create({
      data: {
        assignmentId: dto.assignmentId,
        companyId,
        authorId,
        content: dto.content,
        isPrivate: dto.isPrivate ?? false,
      },
      include: {
        employees: { include: { users: true } },
      },
    });
  }

  async remove(
    id: string,
    companyId: string,
    employeeId: string,
    role: string,
  ) {
    const comment = await this.prisma.taskComment.findFirst({
      where: { id, companyId },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    if (role !== UserRole.ADMIN && comment.authorId !== employeeId) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    return this.prisma.taskComment.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
