import { Module, Global } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { GovernanceEventPublisher } from './governance-event.publisher';
import { GovernanceEventProcessor } from './governance-event.processor';
import { OutboxDispatchWorker } from './outbox-dispatch.worker';
import { EventsReplayController } from './events-replay.controller';

import { WarningEngineListener } from './listeners/warning-engine.listener';
import { ApprovalEngineListener } from './listeners/approval-engine.listener';
import { WarningEngineApprovalListener } from './listeners/warning-engine-approval.listener';
import { PayrollHoldActivationListener } from './listeners/payroll-hold-activation.listener';
import { PayrollHoldReleaseListener } from './listeners/payroll-hold-release.listener';
import { TaskEscalationNotificationListener } from './listeners/task-escalation-notification.listener';
import { AttendanceEvidenceReviewListener } from './listeners/attendance-evidence-review.listener';
import { GovernanceNotificationListener } from './listeners/governance-notification.listener';
import { ProcessedEventRetryWorker } from './workers/processed-event-retry.worker';
import { ProcessingRecoveryWorker } from './workers/processing-recovery.worker';
import { NotificationsModule } from '../notifications/notifications.module';
import { WarningsModule } from '../warnings/warnings.module';
import { ApprovalsModule } from '../approvals/approvals.module';

@Global()
@Module({
  imports: [NotificationsModule, WarningsModule, ApprovalsModule],
  controllers: [EventsReplayController],
  providers: [
    GovernanceEventPublisher,
    GovernanceEventProcessor,
    OutboxDispatchWorker,
    ProcessedEventRetryWorker,
    ProcessingRecoveryWorker,
    WarningEngineListener,
    ApprovalEngineListener,
    WarningEngineApprovalListener,
    PayrollHoldActivationListener,
    PayrollHoldReleaseListener,
    TaskEscalationNotificationListener,
    AttendanceEvidenceReviewListener,
    GovernanceNotificationListener,
  ],
  exports: [GovernanceEventPublisher, GovernanceEventProcessor],
})
export class GovernanceEventsModule {}
