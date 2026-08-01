import { Module } from '@nestjs/common';
import { PayrollHoldsController } from './payroll-holds.controller';
import { HoldRecommendationService } from './hold-recommendation.service';
import { HoldActivationListener } from './hold-activation.listener';
import { HoldReleaseService } from './hold-release.service';
import { PayrollEvaluationService } from './payroll-evaluation.service';
import { HoldSlaWorker } from './hold-sla.worker';
import { PrismaService } from '../../config/prisma.service';
import { ApprovalsModule } from '../approvals/approvals.module';
import { WarningThresholdBreachedListener } from './warning-threshold-breached.listener';

@Module({
  imports: [ApprovalsModule],
  controllers: [PayrollHoldsController],
  providers: [
    PrismaService,
    HoldRecommendationService,
    HoldActivationListener,
    HoldReleaseService,
    PayrollEvaluationService,
    HoldSlaWorker,
    WarningThresholdBreachedListener,
  ],
  exports: [HoldRecommendationService, PayrollEvaluationService],
})
export class PayrollHoldsModule {}
