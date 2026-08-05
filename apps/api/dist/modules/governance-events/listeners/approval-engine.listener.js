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
var ApprovalEngineListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalEngineListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
const governance_event_processor_1 = require("../governance-event.processor");
const events_1 = require("../types/events");
const governance_event_publisher_1 = require("../governance-event.publisher");
const prisma_service_1 = require("../../../config/prisma.service");
const approvals_spawning_service_1 = require("../../approvals/approvals-spawning.service");
let ApprovalEngineListener = ApprovalEngineListener_1 = class ApprovalEngineListener {
    processor;
    publisher;
    prisma;
    spawningService;
    logger = new common_1.Logger(ApprovalEngineListener_1.name);
    constructor(processor, publisher, prisma, spawningService) {
        this.processor = processor;
        this.publisher = publisher;
        this.prisma = prisma;
        this.spawningService = spawningService;
    }
    async handleDisciplinaryReview(event) {
        await this.processor.process(event, 'ApprovalEngineListener_handleDisciplinaryReview', async () => {
            const payload = event.payload ?? {};
            const companyId = payload.companyId || event.companyId || '';
            if (!companyId) {
                this.logger.warn(`DISCIPLINARY_REVIEW_TRIGGERED missing companyId for event ${event.id}`);
                return;
            }
            const entityId = event.entityId;
            if (!entityId) {
                this.logger.warn(`DISCIPLINARY_REVIEW_TRIGGERED missing entityId for event ${event.id}`);
                return;
            }
            this.logger.log(`Processing DISCIPLINARY_REVIEW_TRIGGERED for employee ${entityId}`);
            const existing = await this.prisma.approvalRequest.findFirst({
                where: {
                    companyId,
                    entityType: 'DISCIPLINARY_REVIEW',
                    entityId,
                    status: client_1.ApprovalStatus.PENDING,
                },
            });
            if (existing) {
                await this.publisher.publish(this.prisma, {
                    correlationId: event.correlationId,
                    parentEventId: event.id,
                    eventType: events_1.DomainEventTypes.APPROVAL_CREATED,
                    entityId: existing.entityId,
                    entityType: existing.entityType,
                    companyId: existing.companyId,
                    payload: {
                        companyId: existing.companyId,
                        requestId: existing.id,
                        entityType: existing.entityType,
                        entityId: existing.entityId,
                        triggeredBy: event.eventType,
                    },
                });
                return;
            }
            const createdById = payload.createdById ||
                payload.triggeredBy ||
                (await this.prisma.user.findFirst({
                    where: { companyId, role: 'OWNER' },
                    select: { id: true },
                }))?.id;
            if (!createdById) {
                this.logger.warn(`Cannot spawn disciplinary review for employee ${entityId}: no creator resolved`);
                return;
            }
            await this.spawningService.spawnRequest(companyId, 'DISCIPLINARY_REVIEW', entityId, createdById);
        });
    }
};
exports.ApprovalEngineListener = ApprovalEngineListener;
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.DISCIPLINARY_REVIEW_TRIGGERED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ApprovalEngineListener.prototype, "handleDisciplinaryReview", null);
exports.ApprovalEngineListener = ApprovalEngineListener = ApprovalEngineListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [governance_event_processor_1.GovernanceEventProcessor,
        governance_event_publisher_1.GovernanceEventPublisher,
        prisma_service_1.PrismaService,
        approvals_spawning_service_1.ApprovalsSpawningService])
], ApprovalEngineListener);
//# sourceMappingURL=approval-engine.listener.js.map