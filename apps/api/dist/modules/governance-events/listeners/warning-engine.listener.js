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
var WarningEngineListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarningEngineListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const governance_event_processor_1 = require("../governance-event.processor");
const events_1 = require("../types/events");
const prisma_service_1 = require("../../../config/prisma.service");
const governance_event_publisher_1 = require("../governance-event.publisher");
const warnings_service_1 = require("../../warnings/warnings.service");
const client_1 = require("@prisma/client");
let WarningEngineListener = WarningEngineListener_1 = class WarningEngineListener {
    processor;
    prisma;
    publisher;
    warningsService;
    logger = new common_1.Logger(WarningEngineListener_1.name);
    constructor(processor, prisma, publisher, warningsService) {
        this.processor = processor;
        this.prisma = prisma;
        this.publisher = publisher;
        this.warningsService = warningsService;
    }
    async handleTaskOverdue(event) {
        await this.processor.process(event, 'WarningEngineListener_handleTaskOverdue', async () => {
            this.logger.log(`Processing TASK_OVERDUE for Task ID ${event.entityId}`);
            const payload = event.payload;
            const severity = payload.escalationLevel >= 4
                ? 'LEVEL_3_FINAL'
                : payload.escalationLevel >= 3
                    ? 'LEVEL_2_WRITTEN'
                    : 'LEVEL_1_VERBAL';
            await this.warningsService.issueWarning(payload.companyId, 'SYSTEM', {
                employeeId: payload.assigneeId,
                severity: severity,
                category: client_1.WarningCategory.TASK_PERFORMANCE,
                reason: `Task ${payload.taskId} SLA breached (Escalation Level: ${payload.escalationLevel})`,
                isSystemGenerated: true,
            });
            this.logger.log(`Issued ${severity} warning for assignee ${payload.assigneeId} (escalation level: ${payload.escalationLevel})`);
        });
    }
};
exports.WarningEngineListener = WarningEngineListener;
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.TASK_OVERDUE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WarningEngineListener.prototype, "handleTaskOverdue", null);
exports.WarningEngineListener = WarningEngineListener = WarningEngineListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [governance_event_processor_1.GovernanceEventProcessor,
        prisma_service_1.PrismaService,
        governance_event_publisher_1.GovernanceEventPublisher,
        warnings_service_1.WarningsService])
], WarningEngineListener);
//# sourceMappingURL=warning-engine.listener.js.map