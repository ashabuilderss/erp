import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../config/prisma.service';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class TaskWarningWorker {
  private readonly logger = new Logger(TaskWarningWorker.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 0 * * * *') // Run every hour
  async handlePendingTaskWarnings() {
    this.logger.debug('Running Pending Task Warning Worker...');
    const now = new Date();
    
    // Warn tasks due in the next 2 hours
    const thresholdDate = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const pendingTasks = await this.prisma.task.findMany({
      where: {
        status: TaskStatus.PENDING,
        dueDate: {
          gt: now,
          lte: thresholdDate,
        },
      },
      include: {
        taskHistories: true,
      },
    });

    for (const task of pendingTasks) {
      // Check if we've already warned for this task due date
      const alreadyWarned = task.taskHistories.some(
        (history) => history.event === 'TASK_DUE_WARNING'
      );

      if (!alreadyWarned) {
        await this.prisma.taskHistory.create({
          data: {
            taskId: task.id,
            companyId: task.companyId,
            event: 'TASK_DUE_WARNING',
            comments: 'System warning: Task is due in less than 2 hours.',
          },
        });
        
        // In a real system, send email/push notification to task.assigneeId
        this.logger.log(`Generated due date warning for task ${task.id}`);
      }
    }
  }
}
