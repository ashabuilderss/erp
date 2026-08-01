import { Module } from '@nestjs/common';
import { ApprovalsSpawningService } from './approvals-spawning.service';
import { ApprovalsRuntimeService } from './approvals-runtime.service';
import { ApprovalsSlaWorker } from './approvals-sla.worker';
import { ApprovalsController } from './approvals.controller';
import { PrismaService } from '../../config/prisma.service';

@Module({
  controllers: [ApprovalsController],
  providers: [
    PrismaService,
    ApprovalsSpawningService,
    ApprovalsRuntimeService,
    ApprovalsSlaWorker,
  ],
  exports: [ApprovalsSpawningService, ApprovalsRuntimeService],
})
export class ApprovalsModule {}
