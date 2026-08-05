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
var ProcessingRecoveryWorker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessingRecoveryWorker = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../../config/prisma.service");
const client_1 = require("@prisma/client");
const config_1 = require("@nestjs/config");
let ProcessingRecoveryWorker = ProcessingRecoveryWorker_1 = class ProcessingRecoveryWorker {
    prisma;
    configService;
    logger = new common_1.Logger(ProcessingRecoveryWorker_1.name);
    isRunning = false;
    timeoutMinutes;
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        this.timeoutMinutes =
            this.configService.get('EVENT_PROCESSING_TIMEOUT_MINUTES') || 5;
    }
    async handleRecovery() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        try {
            await this.recoverDomainEvents();
            await this.recoverProcessedEvents();
        }
        catch (error) {
            this.logger.error('Error in ProcessingRecoveryWorker', error);
        }
        finally {
            this.isRunning = false;
        }
    }
    async recoverDomainEvents() {
        const timeoutThreshold = new Date(Date.now() - this.timeoutMinutes * 60 * 1000);
        const stuckEvents = await this.prisma.domainEvent.findMany({
            where: {
                status: client_1.EventStatus.PROCESSING,
                publishedAt: { lt: timeoutThreshold },
            },
        });
        for (const event of stuckEvents) {
            await this.prisma.domainEvent.update({
                where: { id: event.id },
                data: {
                    status: client_1.EventStatus.PENDING,
                    attemptCount: event.attemptCount + 1,
                },
            });
            this.logger.log(`Recovered DomainEvent ${event.id} (correlationId: ${event.correlationId}) from stuck PROCESSING state.`);
            const companyId = event.payload?.companyId;
            if (companyId) {
                await this.prisma.securityEvent.create({
                    data: {
                        eventType: 'EVENT_PROCESSING_RECOVERED',
                        severity: 'warning',
                        description: `Recovered DomainEvent ${event.id} from stuck PROCESSING state.`,
                        companyId,
                    },
                });
            }
        }
    }
    async recoverProcessedEvents() {
        const timeoutThreshold = new Date(Date.now() - this.timeoutMinutes * 60 * 1000);
        const stuckProcessedEvents = await this.prisma.processedEvent.findMany({
            where: {
                status: client_1.ProcessedEventStatus.PROCESSING,
                processedAt: { lt: timeoutThreshold },
            },
        });
        for (const processedEvent of stuckProcessedEvents) {
            const domainEvent = await this.prisma.domainEvent.findUnique({
                where: { id: processedEvent.eventId },
            });
            const correlationId = domainEvent?.correlationId || 'unknown';
            await this.prisma.processedEvent.update({
                where: {
                    eventId_handlerName: {
                        eventId: processedEvent.eventId,
                        handlerName: processedEvent.handlerName,
                    },
                },
                data: {
                    status: client_1.ProcessedEventStatus.FAILED,
                    retryCount: processedEvent.retryCount + 1,
                    nextRetryAt: new Date(),
                },
            });
            this.logger.log(`Recovered ProcessedEvent handler ${processedEvent.handlerName} for event ${processedEvent.eventId} (correlationId: ${correlationId}) from stuck PROCESSING state.`);
            const companyId = domainEvent?.payload?.companyId;
            if (companyId) {
                await this.prisma.securityEvent.create({
                    data: {
                        eventType: 'EVENT_HANDLER_PROCESSING_RECOVERED',
                        severity: 'warning',
                        description: `Recovered ProcessedEvent handler ${processedEvent.handlerName} for event ${processedEvent.eventId} from stuck PROCESSING state.`,
                        companyId,
                    },
                });
            }
        }
    }
};
exports.ProcessingRecoveryWorker = ProcessingRecoveryWorker;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ProcessingRecoveryWorker.prototype, "handleRecovery", null);
exports.ProcessingRecoveryWorker = ProcessingRecoveryWorker = ProcessingRecoveryWorker_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], ProcessingRecoveryWorker);
//# sourceMappingURL=processing-recovery.worker.js.map