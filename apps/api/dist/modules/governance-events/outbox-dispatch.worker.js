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
var OutboxDispatchWorker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxDispatchWorker = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../config/prisma.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
const config_1 = require("@nestjs/config");
let OutboxDispatchWorker = OutboxDispatchWorker_1 = class OutboxDispatchWorker {
    prisma;
    eventEmitter;
    configService;
    logger = new common_1.Logger(OutboxDispatchWorker_1.name);
    isRunning = false;
    batchSize;
    constructor(prisma, eventEmitter, configService) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
        this.configService = configService;
        this.batchSize =
            this.configService.get('EVENT_DISPATCH_BATCH_SIZE') || 100;
    }
    async handleOutbox() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        try {
            await this.processPendingEvents();
        }
        catch (error) {
            this.logger.error('Error in OutboxDispatchWorker', error);
        }
        finally {
            this.isRunning = false;
        }
    }
    async processPendingEvents() {
        const pendingEvents = await this.prisma.domainEvent.findMany({
            where: { status: client_1.EventStatus.PENDING },
            take: this.batchSize,
            orderBy: { publishedAt: 'asc' },
        });
        for (const event of pendingEvents) {
            const claimed = await this.prisma.domainEvent.updateMany({
                where: { id: event.id, status: client_1.EventStatus.PENDING },
                data: { status: client_1.EventStatus.PROCESSING },
            });
            if (claimed.count === 0) {
                continue;
            }
            try {
                await this.eventEmitter.emitAsync(event.eventType, event);
                await this.prisma.domainEvent.update({
                    where: { id: event.id },
                    data: { status: client_1.EventStatus.DISPATCHED },
                });
            }
            catch (err) {
                this.logger.error(`Failed to dispatch event ${event.id}:`, err);
                const nextAttempt = event.attemptCount + 1;
                const newStatus = nextAttempt >= 3 ? client_1.EventStatus.DEAD_LETTER : client_1.EventStatus.FAILED;
                await this.prisma.domainEvent.update({
                    where: { id: event.id },
                    data: {
                        status: newStatus,
                        attemptCount: nextAttempt,
                        lastError: err.message || String(err),
                    },
                });
            }
        }
    }
};
exports.OutboxDispatchWorker = OutboxDispatchWorker;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_10_SECONDS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OutboxDispatchWorker.prototype, "handleOutbox", null);
exports.OutboxDispatchWorker = OutboxDispatchWorker = OutboxDispatchWorker_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2,
        config_1.ConfigService])
], OutboxDispatchWorker);
//# sourceMappingURL=outbox-dispatch.worker.js.map