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
var WarningEngineApprovalListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarningEngineApprovalListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const governance_event_processor_1 = require("../governance-event.processor");
const events_1 = require("../types/events");
const prisma_service_1 = require("../../../config/prisma.service");
let WarningEngineApprovalListener = WarningEngineApprovalListener_1 = class WarningEngineApprovalListener {
    processor;
    prisma;
    logger = new common_1.Logger(WarningEngineApprovalListener_1.name);
    constructor(processor, prisma) {
        this.processor = processor;
        this.prisma = prisma;
    }
    async handleApprovalOutcome(event) {
        await this.processor.process(event, 'WarningEngineApprovalListener_handleApprovalOutcome', async () => {
            if (event.entityType !== 'WARNING') {
                this.logger.debug(`Ignored approval for entity type ${event.entityType}. Not a WARNING.`);
                return;
            }
            this.logger.log(`Processing WARNING approval outcome [${event.eventType}] for entity ${event.entityId}`);
            const newStatus = event.eventType === events_1.DomainEventTypes.APPROVAL_APPROVED
                ? 'APPROVED'
                : 'REJECTED';
            const warningId = event.payload?.warningId || event.entityId;
            await this.prisma.warning.update({
                where: { id: warningId },
                data: { status: newStatus },
            });
            this.logger.log(`Warning ${warningId} status updated to ${newStatus}`);
        });
    }
};
exports.WarningEngineApprovalListener = WarningEngineApprovalListener;
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.APPROVAL_APPROVED),
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.APPROVAL_REJECTED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WarningEngineApprovalListener.prototype, "handleApprovalOutcome", null);
exports.WarningEngineApprovalListener = WarningEngineApprovalListener = WarningEngineApprovalListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [governance_event_processor_1.GovernanceEventProcessor,
        prisma_service_1.PrismaService])
], WarningEngineApprovalListener);
//# sourceMappingURL=warning-engine-approval.listener.js.map