"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TaskOverdueListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskOverdueListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const warnings_service_1 = require("./warnings.service");
const events_1 = require("../governance-events/types/events");
const client_1 = require("@prisma/client");
let TaskOverdueListener = TaskOverdueListener_1 = class TaskOverdueListener {
    warningsService;
    logger = new common_1.Logger(TaskOverdueListener_1.name);
    constructor(warningsService) {
        this.warningsService = warningsService;
    }
    async handleTaskOverdue(event) {
        this.logger.log(`Processing TASK_OVERDUE for Task ID ${event.entityId}`);
        try {
            const payload = event.payload;
            const severity = this.mapEscalationToSeverity(payload.escalationLevel);
            await this.warningsService.issueWarning(payload.companyId, 'SYSTEM', {
                employeeId: payload.assigneeId,
                severity,
                category: client_1.WarningCategory.TASK_PERFORMANCE,
                reason: `Task ${payload.taskId} SLA breached (Escalation Level: ${payload.escalationLevel})`,
                isSystemGenerated: true,
            });
            this.logger.log(`Issued ${severity} warning for Task ID ${event.entityId} (escalation level ${payload.escalationLevel})`);
        }
        catch (error) {
            this.logger.error(`Failed to issue warning for TASK_OVERDUE: ${error.message}`);
        }
    }
    mapEscalationToSeverity(escalationLevel) {
        if (escalationLevel >= 4)
            return client_1.WarningSeverity.LEVEL_3_FINAL;
        if (escalationLevel >= 3)
            return client_1.WarningSeverity.LEVEL_2_WRITTEN;
        return client_1.WarningSeverity.LEVEL_1_VERBAL;
    }
};
exports.TaskOverdueListener = TaskOverdueListener;
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.TASK_OVERDUE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TaskOverdueListener.prototype, "handleTaskOverdue", null);
exports.TaskOverdueListener = TaskOverdueListener = TaskOverdueListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [warnings_service_1.WarningsService])
], TaskOverdueListener);
//# sourceMappingURL=task-overdue.listener.js.map