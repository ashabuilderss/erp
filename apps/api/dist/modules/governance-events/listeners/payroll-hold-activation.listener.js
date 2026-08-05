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
var PayrollHoldActivationListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollHoldActivationListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
const governance_event_processor_1 = require("../governance-event.processor");
const events_1 = require("../types/events");
const governance_event_publisher_1 = require("../governance-event.publisher");
const prisma_service_1 = require("../../../config/prisma.service");
let PayrollHoldActivationListener = PayrollHoldActivationListener_1 = class PayrollHoldActivationListener {
    processor;
    publisher;
    prisma;
    logger = new common_1.Logger(PayrollHoldActivationListener_1.name);
    constructor(processor, publisher, prisma) {
        this.processor = processor;
        this.publisher = publisher;
        this.prisma = prisma;
    }
    async handleApprovalApproved(event) {
        await this.processor.process(event, 'PayrollHoldActivationListener_handleApprovalApproved', async () => {
            if (event.entityType !== 'PAYROLL_HOLD') {
                this.logger.debug(`Ignored approval for entity type ${event.entityType}. Not a PAYROLL_HOLD.`);
                return;
            }
            this.logger.log(`Processing PAYROLL_HOLD activation for entity ${event.entityId}`);
            const holdId = event.payload?.holdId || event.entityId;
            const companyId = event.payload?.companyId || '';
            await this.prisma.$transaction(async (tx) => {
                await tx.payrollHold.update({
                    where: { id: holdId },
                    data: { status: client_1.PayrollHoldStatus.ACTIVE_HOLD },
                });
                await tx.payrollHoldHistory.create({
                    data: {
                        holdId,
                        companyId,
                        event: 'ACTIVATED',
                        actorId: event.payload?.actorId || null,
                        comments: 'Approved via governance event',
                    },
                });
                await this.publisher.publish(tx, {
                    correlationId: event.correlationId,
                    parentEventId: event.id,
                    eventType: events_1.DomainEventTypes.PAYROLL_HOLD_ACTIVATED,
                    entityId: holdId,
                    entityType: 'PAYROLL_HOLD',
                    companyId,
                    payload: {
                        companyId,
                        status: 'ACTIVE',
                    },
                });
            });
        });
    }
};
exports.PayrollHoldActivationListener = PayrollHoldActivationListener;
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.APPROVAL_APPROVED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PayrollHoldActivationListener.prototype, "handleApprovalApproved", null);
exports.PayrollHoldActivationListener = PayrollHoldActivationListener = PayrollHoldActivationListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [governance_event_processor_1.GovernanceEventProcessor,
        governance_event_publisher_1.GovernanceEventPublisher,
        prisma_service_1.PrismaService])
], PayrollHoldActivationListener);
//# sourceMappingURL=payroll-hold-activation.listener.js.map