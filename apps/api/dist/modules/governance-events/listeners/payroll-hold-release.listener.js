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
var PayrollHoldReleaseListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollHoldReleaseListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
const governance_event_processor_1 = require("../governance-event.processor");
const events_1 = require("../types/events");
const prisma_service_1 = require("../../../config/prisma.service");
const governance_event_publisher_1 = require("../governance-event.publisher");
let PayrollHoldReleaseListener = PayrollHoldReleaseListener_1 = class PayrollHoldReleaseListener {
    processor;
    prisma;
    publisher;
    logger = new common_1.Logger(PayrollHoldReleaseListener_1.name);
    constructor(processor, prisma, publisher) {
        this.processor = processor;
        this.prisma = prisma;
        this.publisher = publisher;
    }
    async handleTaskCompleted(event) {
        await this.processor.process(event, 'PayrollHoldReleaseListener_handleTaskCompleted', async () => {
            this.logger.log(`Processing TASK_COMPLETED for PayrollHoldRelease Check (Task ID: ${event.entityId})`);
            const activeHolds = await this.prisma.payrollHold.findMany({
                where: {
                    source: client_1.PayrollHoldSource.TASK_ENGINE,
                    sourceId: event.entityId,
                    status: client_1.PayrollHoldStatus.ACTIVE_HOLD,
                },
            });
            if (activeHolds.length === 0) {
                this.logger.debug(`No active payroll holds found for Task ID ${event.entityId}`);
                return;
            }
            for (const hold of activeHolds) {
                this.logger.log(`Initiating release workflow for PayrollHold ${hold.id}`);
                await this.publisher.publish(this.prisma, {
                    correlationId: event.correlationId,
                    parentEventId: event.id,
                    eventType: events_1.DomainEventTypes.PAYROLL_HOLD_RELEASE_REQUESTED,
                    entityId: hold.id,
                    entityType: 'PAYROLL_HOLD',
                    companyId: event.payload?.companyId || '',
                    payload: {
                        companyId: event.payload?.companyId || '',
                        releaseReason: 'TASK_COMPLETED',
                    },
                });
            }
        });
    }
};
exports.PayrollHoldReleaseListener = PayrollHoldReleaseListener;
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.TASK_COMPLETED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PayrollHoldReleaseListener.prototype, "handleTaskCompleted", null);
exports.PayrollHoldReleaseListener = PayrollHoldReleaseListener = PayrollHoldReleaseListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [governance_event_processor_1.GovernanceEventProcessor,
        prisma_service_1.PrismaService,
        governance_event_publisher_1.GovernanceEventPublisher])
], PayrollHoldReleaseListener);
//# sourceMappingURL=payroll-hold-release.listener.js.map