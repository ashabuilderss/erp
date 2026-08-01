import { Module } from '@nestjs/common';
import { WarningsController } from './warnings.controller';
import { WarningsService } from './warnings.service';
import { WarningApprovalListener } from './warning-approval.listener';
import { WarningExpirationWorker } from './warning-expiration.worker';
import { WarningAckSlaWorker } from './warning-ack-sla.worker';
import { PrismaService } from '../../config/prisma.service';
import { ApprovalsModule } from '../approvals/approvals.module';

@Module({
  imports: [ApprovalsModule],
  controllers: [WarningsController],
  providers: [
    PrismaService,
    WarningsService,
    WarningApprovalListener,
    WarningExpirationWorker,
    WarningAckSlaWorker,
  ],
  exports: [WarningsService],
})
export class WarningsModule {}
