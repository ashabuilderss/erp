import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TaskProofService } from './task-proof.service';
import { TaskExtensionService } from './task-extension.service';
import { TaskEscalationWorker } from './task-escalation.worker';
import { TaskWarningWorker } from './task-warning.worker';
import { PrismaService } from '../../config/prisma.service';
import { ApprovalsModule } from '../approvals/approvals.module';

@Module({
  imports: [ApprovalsModule],
  controllers: [TasksController],
  providers: [
    PrismaService,
    TasksService,
    TaskProofService,
    TaskExtensionService,
    TaskEscalationWorker,
    TaskWarningWorker,
  ],
})
export class TasksModule {}
