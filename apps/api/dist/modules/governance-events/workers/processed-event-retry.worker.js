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
var ProcessedEventRetryWorker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessedEventRetryWorker = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../../config/prisma.service");
const client_1 = require("@prisma/client");
const event_emitter_1 = require("@nestjs/event-emitter");
const config_1 = require("@nestjs/config");
let ProcessedEventRetryWorker = ProcessedEventRetryWorker_1 = class ProcessedEventRetryWorker {
    prisma;
    eventEmitter;
    configService;
    logger = new common_1.Logger(ProcessedEventRetryWorker_1.name);
    isRunning = false;
    batchSize;
    constructor(prisma, eventEmitter, configService) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
        this.configService = configService;
        this.batchSize =
            this.configService.get('EVENT_RETRY_BATCH_SIZE') || 100;
    }
    async handleRetries() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        try {
            await this.processRetries();
        }
        catch (error) {
            this.logger.error('Error in ProcessedEventRetryWorker', error);
        }
        finally {
            this.isRunning = false;
        }
    }
    async processRetries() {
        const now = new Date();
        const failedEvents = await this.prisma.processedEvent.findMany({
            where: {
                status: client_1.ProcessedEventStatus.FAILED,
                retryCount: { lt: 3 },
                nextRetryAt: { lte: now },
            },
            take: this.batchSize,
            orderBy: { nextRetryAt: 'asc' },
        });
        for (const processedEvent of failedEvents) {
            const claimed = await this.prisma.processedEvent.updateMany({
                where: {
                    eventId: processedEvent.eventId,
                    handlerName: processedEvent.handlerName,
                    status: client_1.ProcessedEventStatus.FAILED,
                },
                data: { status: client_1.ProcessedEventStatus.PROCESSING },
            });
            if (claimed.count === 0) {
                continue;
            }
            const domainEvent = await this.prisma.domainEvent.findUnique({
                where: { id: processedEvent.eventId },
            });
            if (!domainEvent) {
                this.logger.warn(`Domain event ${processedEvent.eventId} not found. Marking DEAD_LETTER.`);
                await this.markDeadLetter(processedEvent);
                continue;
            }
            this.logger.log(`Retrying handler ${processedEvent.handlerName} for event ${processedEvent.eventId} (Attempt ${processedEvent.retryCount + 1})`);
            try {
                await this.eventEmitter.emitAsync(domainEvent.eventType, domainEvent);
            }
            catch (err) {
                this.logger.error(`Failed to emit for retry: ${processedEvent.eventId}`, err);
                await this.handleFailure(processedEvent, err);
            }
        }
    }
    async markDeadLetter(processedEvent) {
        await this.prisma.processedEvent.update({
            where: {
                eventId_handlerName: {
                    eventId: processedEvent.eventId,
                    handlerName: processedEvent.handlerName,
                },
            },
            data: { status: client_1.ProcessedEventStatus.DEAD_LETTER },
        });
        const domainEvent = await this.prisma.domainEvent.findUnique({
            where: { id: processedEvent.eventId },
        });
        const companyId = domainEvent?.payload?.companyId;
        if (companyId) {
            await this.prisma.securityEvent.create({
                data: {
                    eventType: 'EVENT_DEAD_LETTERED',
                    severity: 'critical',
                    description: `Handler ${processedEvent.handlerName} permanently failed for event ${processedEvent.eventId}`,
                    companyId,
                },
            });
        }
    }
    async handleFailure(processedEvent, error) {
        const nextRetry = processedEvent.retryCount + 1;
        if (nextRetry >= 3) {
            await this.markDeadLetter(processedEvent);
        }
        else {
            const backoffSeconds = nextRetry === 1 ? 30 : nextRetry === 2 ? 60 : 120;
            const nextRetryAt = new Date(Date.now() + backoffSeconds * 1000);
            await this.prisma.processedEvent.update({
                where: {
                    eventId_handlerName: {
                        eventId: processedEvent.eventId,
                        handlerName: processedEvent.handlerName,
                    },
                },
                data: {
                    status: client_1.ProcessedEventStatus.FAILED,
                    retryCount: nextRetry,
                    lastError: error.message || String(error),
                    nextRetryAt,
                },
            });
        }
    }
};
exports.ProcessedEventRetryWorker = ProcessedEventRetryWorker;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ProcessedEventRetryWorker.prototype, "handleRetries", null);
exports.ProcessedEventRetryWorker = ProcessedEventRetryWorker = ProcessedEventRetryWorker_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2,
        config_1.ConfigService])
], ProcessedEventRetryWorker);
//# sourceMappingURL=processed-event-retry.worker.js.map