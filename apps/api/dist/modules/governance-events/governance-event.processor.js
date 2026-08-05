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
var GovernanceEventProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GovernanceEventProcessor = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
const client_1 = require("@prisma/client");
let GovernanceEventProcessor = GovernanceEventProcessor_1 = class GovernanceEventProcessor {
    prisma;
    logger = new common_1.Logger(GovernanceEventProcessor_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async process(event, handlerName, handler) {
        let processedEvent = await this.prisma.processedEvent.findUnique({
            where: {
                eventId_handlerName: {
                    eventId: event.id,
                    handlerName,
                },
            },
        });
        if (processedEvent &&
            processedEvent.status === client_1.ProcessedEventStatus.SUCCESS) {
            this.logger.debug(`Event ${event.id} already processed successfully by ${handlerName}. Skipping.`);
            return;
        }
        if (!processedEvent) {
            processedEvent = await this.prisma.processedEvent.create({
                data: {
                    eventId: event.id,
                    handlerName,
                    status: client_1.ProcessedEventStatus.PENDING,
                },
            });
        }
        try {
            await handler();
            await this.prisma.processedEvent.update({
                where: { eventId_handlerName: { eventId: event.id, handlerName } },
                data: { status: client_1.ProcessedEventStatus.SUCCESS, lastError: null },
            });
            this.logger.log(`[SUCCESS] ${handlerName} processed event ${event.id}`);
        }
        catch (error) {
            const currentRetry = processedEvent.retryCount + 1;
            const isDeadLetter = currentRetry >= 3;
            const newStatus = isDeadLetter
                ? client_1.ProcessedEventStatus.DEAD_LETTER
                : client_1.ProcessedEventStatus.FAILED;
            let nextRetryAt = null;
            if (!isDeadLetter) {
                const backoffSeconds = currentRetry === 1 ? 30 : currentRetry === 2 ? 60 : 120;
                nextRetryAt = new Date(Date.now() + backoffSeconds * 1000);
            }
            await this.prisma.processedEvent.update({
                where: { eventId_handlerName: { eventId: event.id, handlerName } },
                data: {
                    status: newStatus,
                    retryCount: currentRetry,
                    lastError: error.message || String(error),
                    nextRetryAt,
                },
            });
            if (isDeadLetter) {
                const companyId = event.payload?.companyId;
                if (companyId) {
                    await this.prisma.securityEvent.create({
                        data: {
                            eventType: 'EVENT_DEAD_LETTERED',
                            severity: 'critical',
                            description: `Handler ${handlerName} permanently failed for event ${event.id}`,
                            companyId,
                        },
                    });
                }
            }
            this.logger.error(`[${newStatus}] ${handlerName} failed on event ${event.id}:`, error);
        }
    }
};
exports.GovernanceEventProcessor = GovernanceEventProcessor;
exports.GovernanceEventProcessor = GovernanceEventProcessor = GovernanceEventProcessor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GovernanceEventProcessor);
//# sourceMappingURL=governance-event.processor.js.map