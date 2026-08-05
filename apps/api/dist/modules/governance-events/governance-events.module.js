"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GovernanceEventsModule = void 0;
const common_1 = require("@nestjs/common");
const governance_event_publisher_1 = require("./governance-event.publisher");
const governance_event_processor_1 = require("./governance-event.processor");
const outbox_dispatch_worker_1 = require("./outbox-dispatch.worker");
const events_replay_controller_1 = require("./events-replay.controller");
const warning_engine_listener_1 = require("./listeners/warning-engine.listener");
const approval_engine_listener_1 = require("./listeners/approval-engine.listener");
const warning_engine_approval_listener_1 = require("./listeners/warning-engine-approval.listener");
const payroll_hold_activation_listener_1 = require("./listeners/payroll-hold-activation.listener");
const payroll_hold_release_listener_1 = require("./listeners/payroll-hold-release.listener");
const task_escalation_notification_listener_1 = require("./listeners/task-escalation-notification.listener");
const attendance_evidence_review_listener_1 = require("./listeners/attendance-evidence-review.listener");
const governance_notification_listener_1 = require("./listeners/governance-notification.listener");
const processed_event_retry_worker_1 = require("./workers/processed-event-retry.worker");
const processing_recovery_worker_1 = require("./workers/processing-recovery.worker");
const notifications_module_1 = require("../notifications/notifications.module");
const warnings_module_1 = require("../warnings/warnings.module");
const approvals_module_1 = require("../approvals/approvals.module");
let GovernanceEventsModule = class GovernanceEventsModule {
};
exports.GovernanceEventsModule = GovernanceEventsModule;
exports.GovernanceEventsModule = GovernanceEventsModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [notifications_module_1.NotificationsModule, warnings_module_1.WarningsModule, approvals_module_1.ApprovalsModule],
        controllers: [events_replay_controller_1.EventsReplayController],
        providers: [
            governance_event_publisher_1.GovernanceEventPublisher,
            governance_event_processor_1.GovernanceEventProcessor,
            outbox_dispatch_worker_1.OutboxDispatchWorker,
            processed_event_retry_worker_1.ProcessedEventRetryWorker,
            processing_recovery_worker_1.ProcessingRecoveryWorker,
            warning_engine_listener_1.WarningEngineListener,
            approval_engine_listener_1.ApprovalEngineListener,
            warning_engine_approval_listener_1.WarningEngineApprovalListener,
            payroll_hold_activation_listener_1.PayrollHoldActivationListener,
            payroll_hold_release_listener_1.PayrollHoldReleaseListener,
            task_escalation_notification_listener_1.TaskEscalationNotificationListener,
            attendance_evidence_review_listener_1.AttendanceEvidenceReviewListener,
            governance_notification_listener_1.GovernanceNotificationListener,
        ],
        exports: [governance_event_publisher_1.GovernanceEventPublisher, governance_event_processor_1.GovernanceEventProcessor],
    })
], GovernanceEventsModule);
//# sourceMappingURL=governance-events.module.js.map