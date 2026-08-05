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
exports.AnnouncementReceiptService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
const governance_event_publisher_1 = require("../governance-events/governance-event.publisher");
const events_1 = require("../governance-events/types/events");
const audit_service_1 = require("../audit/audit.service");
let AnnouncementReceiptService = class AnnouncementReceiptService {
    prisma;
    eventPublisher;
    auditService;
    constructor(prisma, eventPublisher, auditService) {
        this.prisma = prisma;
        this.eventPublisher = eventPublisher;
        this.auditService = auditService;
    }
    async markRead(input) {
        const { companyId, announcementId, userId } = input;
        const announcement = await this.prisma.announcement.findFirst({
            where: { id: announcementId, companyId },
        });
        if (!announcement) {
            throw new common_1.NotFoundException(`Announcement with ID ${announcementId} not found`);
        }
        await this.prisma.$transaction(async (tx) => {
            const existing = await tx.announcementReceipt.findUnique({
                where: { announcementId_userId: { announcementId, userId } },
            });
            if (existing) {
                if (!existing.readAt) {
                    await tx.announcementReceipt.update({
                        where: { id: existing.id },
                        data: { readAt: new Date() },
                    });
                }
            }
            else {
                await tx.announcementReceipt.create({
                    data: {
                        companyId,
                        announcementId,
                        userId,
                        readAt: new Date(),
                    },
                });
            }
            await this.eventPublisher.publish(tx, {
                eventType: events_1.DomainEventTypes.ANNOUNCEMENT_READ,
                entityId: announcementId,
                entityType: 'Announcement',
                companyId,
                payload: {
                    companyId,
                    announcementId,
                    userId,
                    readAt: new Date(),
                },
            });
        });
    }
    async acknowledge(input) {
        const { companyId, announcementId, userId } = input;
        const announcement = await this.prisma.announcement.findFirst({
            where: { id: announcementId, companyId },
        });
        if (!announcement) {
            throw new common_1.NotFoundException(`Announcement with ID ${announcementId} not found`);
        }
        await this.prisma.$transaction(async (tx) => {
            const existing = await tx.announcementReceipt.findUnique({
                where: { announcementId_userId: { announcementId, userId } },
            });
            if (existing) {
                await tx.announcementReceipt.update({
                    where: { id: existing.id },
                    data: {
                        readAt: existing.readAt ?? new Date(),
                        acknowledgedAt: new Date(),
                    },
                });
            }
            else {
                await tx.announcementReceipt.create({
                    data: {
                        companyId,
                        announcementId,
                        userId,
                        readAt: new Date(),
                        acknowledgedAt: new Date(),
                    },
                });
            }
            await this.eventPublisher.publish(tx, {
                eventType: events_1.DomainEventTypes.ANNOUNCEMENT_ACKNOWLEDGED,
                entityId: announcementId,
                entityType: 'Announcement',
                companyId,
                payload: {
                    companyId,
                    announcementId,
                    userId,
                    acknowledgedAt: new Date(),
                },
            });
        });
    }
    async getReceipts(announcementId, companyId) {
        return this.prisma.announcementReceipt.findMany({
            where: { announcementId, companyId },
            include: {
                users: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
        });
    }
    async getReceiptCounts(announcementId, companyId) {
        const [total, readCount, acknowledgedCount] = await Promise.all([
            this.prisma.announcementReceipt.count({
                where: { announcementId, companyId },
            }),
            this.prisma.announcementReceipt.count({
                where: { announcementId, companyId, readAt: { not: null } },
            }),
            this.prisma.announcementReceipt.count({
                where: { announcementId, companyId, acknowledgedAt: { not: null } },
            }),
        ]);
        return { total, readCount, acknowledgedCount };
    }
};
exports.AnnouncementReceiptService = AnnouncementReceiptService;
exports.AnnouncementReceiptService = AnnouncementReceiptService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        governance_event_publisher_1.GovernanceEventPublisher,
        audit_service_1.AuditService])
], AnnouncementReceiptService);
//# sourceMappingURL=announcement-receipt.service.js.map