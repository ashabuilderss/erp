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
var GovernanceEventPublisher_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GovernanceEventPublisher = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
let GovernanceEventPublisher = GovernanceEventPublisher_1 = class GovernanceEventPublisher {
    prisma;
    logger = new common_1.Logger(GovernanceEventPublisher_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async publish(tx, options) {
        const correlationId = options.correlationId || (0, crypto_1.randomUUID)();
        await tx.domainEvent.create({
            data: {
                eventType: options.eventType,
                entityId: options.entityId,
                entityType: options.entityType,
                companyId: options.companyId,
                payload: options.payload,
                correlationId,
                parentEventId: options.parentEventId,
                eventVersion: options.eventVersion || 1,
                status: client_1.EventStatus.PENDING,
            },
        });
        this.logger.debug(`Stored DomainEvent [${options.eventType}] for entity ${options.entityType}:${options.entityId}`);
    }
};
exports.GovernanceEventPublisher = GovernanceEventPublisher;
exports.GovernanceEventPublisher = GovernanceEventPublisher = GovernanceEventPublisher_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GovernanceEventPublisher);
//# sourceMappingURL=governance-event.publisher.js.map