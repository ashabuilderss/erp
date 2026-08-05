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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentAccessService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
const governance_event_publisher_1 = require("../governance-events/governance-event.publisher");
const events_1 = require("../governance-events/types/events");
const document_access_log_service_1 = require("../audit/document-access-log.service");
let DocumentAccessService = class DocumentAccessService {
    prisma;
    eventPublisher;
    accessLogService;
    constructor(prisma, eventPublisher, accessLogService) {
        this.prisma = prisma;
        this.eventPublisher = eventPublisher;
        this.accessLogService = accessLogService;
    }
    async logAccess(input) {
        const { companyId, documentId, userId, action, ipAddress, userAgent } = input;
        const document = await this.prisma.documentRegistry.findFirst({
            where: { id: documentId, companyId },
        });
        if (!document) {
            throw new common_1.NotFoundException(`Document with ID ${documentId} not found`);
        }
        const accessLogId = await this.prisma.$transaction(async (tx) => {
            await this.accessLogService.log({
                tx,
                companyId,
                documentId,
                userId,
                action,
                ipAddress,
                userAgent,
            });
            await this.eventPublisher.publish(tx, {
                eventType: events_1.DomainEventTypes.DOCUMENT_ACCESSED,
                entityId: documentId,
                entityType: 'DocumentRegistry',
                companyId,
                payload: {
                    companyId,
                    documentId,
                    userId,
                    action,
                },
            });
            return `access-${documentId}-${userId}-${Date.now()}`;
        });
        return accessLogId;
    }
    async getAccessLogs(documentId, companyId, options) {
        const { page = 1, limit = 20 } = options;
        const where = { documentId, companyId };
        const [data, total] = await Promise.all([
            this.prisma.documentAccessLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    users: {
                        select: { id: true, firstName: true, lastName: true, email: true },
                    },
                },
            }),
            this.prisma.documentAccessLog.count({ where }),
        ]);
        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async getAccessStats(documentId, companyId) {
        const [totalAccesses, uniqueUsers] = await Promise.all([
            this.prisma.documentAccessLog.count({
                where: { documentId, companyId },
            }),
            this.prisma.documentAccessLog.groupBy({
                by: ['userId'],
                where: { documentId, companyId },
                _count: { userId: true },
            }),
        ]);
        return { totalAccesses, uniqueUserCount: uniqueUsers.length };
    }
};
exports.DocumentAccessService = DocumentAccessService;
exports.DocumentAccessService = DocumentAccessService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        governance_event_publisher_1.GovernanceEventPublisher,
        document_access_log_service_1.DocumentAccessLogService])
], DocumentAccessService);
//# sourceMappingURL=document-access.service.js.map