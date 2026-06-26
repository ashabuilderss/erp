import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../config/prisma.service';

@Injectable()
export class TaskOverdueJob {
  private readonly logger = new Logger(TaskOverdueJob.name);

  constructor(private prisma: PrismaService) {}

  @Cron('*/15 * * * *')
  async handle() {
    this.logger.log('Checking for overdue tasks...');
    const now = new Date();

    const overdue = await this.prisma.employeeAssignment.findMany({
      where: {
        endDate: { lt: now },
        type: { in: ['PROPERTY', 'LEAD', 'SITE_VISIT', 'BOOKING'] },
      },
      include: {
        employee: { include: { user: true } },
      },
    });

    if (overdue.length === 0) {
      this.logger.log('No overdue tasks found');
      return;
    }

    this.logger.log(`Found ${overdue.length} overdue tasks — creating notifications`);

    for (const assignment of overdue) {
      const user = assignment.employee?.user;
      if (!user) continue;

      const existingNotification = await this.prisma.notification.findFirst({
        where: {
          userId: user.id,
          type: 'TASK_OVERDUE',
          link: { contains: assignment.id },
          createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
        },
      });
      if (existingNotification) continue;

      await this.prisma.notification.create({
        data: {
          userId: user.id,
          companyId: assignment.companyId,
          title: 'Task Overdue',
          message: `Task ${assignment.type} is overdue (was due ${assignment.endDate?.toLocaleDateString()})`,
          type: 'TASK_OVERDUE',
          link: `/my-tasks?id=${assignment.id}`,
        },
      });
    }

    this.logger.log(`Created notifications for ${overdue.length} overdue tasks`);
  }
}
