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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvidenceReviewService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../config/prisma.service");
const client_1 = require("@prisma/client");
const governance_event_publisher_1 = require("../../governance-events/governance-event.publisher");
const events_1 = require("../../governance-events/types/events");
const company_time_1 = require("../../../common/utils/company-time");
let EvidenceReviewService = class EvidenceReviewService {
    prisma;
    eventPublisher;
    storageProvider;
    constructor(prisma, eventPublisher, storageProvider) {
        this.prisma = prisma;
        this.eventPublisher = eventPublisher;
        this.storageProvider = storageProvider;
    }
    async create(dto, companyId, reviewedById) {
        const existing = await this.prisma.attendanceEvidenceReview.findFirst({
            where: { evidenceId: dto.evidenceId, companyId },
        });
        if (existing) {
            return existing;
        }
        return this.prisma.attendanceEvidenceReview.create({
            data: {
                companyId,
                evidenceId: dto.evidenceId,
                punchId: dto.punchId,
                reviewedById,
            },
        });
    }
    async findAll(dto, companyId) {
        const page = parseInt(dto.page || '1', 10);
        const limit = parseInt(dto.limit || '20', 10);
        const skip = (page - 1) * limit;
        const where = { companyId };
        if (dto.status)
            where.status = dto.status;
        const [items, total] = await Promise.all([
            this.prisma.attendanceEvidenceReview.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.attendanceEvidenceReview.count({ where }),
        ]);
        const evidenceIds = [...new Set(items.map((i) => i.evidenceId))];
        const evidenceMap = await this.prisma.attendanceEvidence.findMany({
            where: { id: { in: evidenceIds } },
            include: {
                attendancePunches: true,
                storageObjects: true,
            },
        });
        const evidenceById = new Map(evidenceMap.map((e) => [e.id, e]));
        const enriched = items.map((item) => {
            const evidence = evidenceById.get(item.evidenceId);
            const punch = evidence?.attendancePunches ?? null;
            return {
                ...item,
                punch,
            };
        });
        return { items: enriched, total, page, limit };
    }
    async findOne(id, companyId) {
        const review = await this.prisma.attendanceEvidenceReview.findUnique({
            where: { id },
        });
        if (!review || review.companyId !== companyId) {
            throw new common_1.NotFoundException('Evidence review not found');
        }
        return review;
    }
    async getForView(id, companyId) {
        const review = await this.findOne(id, companyId);
        const evidence = review.evidenceId
            ? await this.prisma.attendanceEvidence.findUnique({
                where: { id: review.evidenceId },
                include: {
                    attendancePunches: true,
                    storageObjects: true,
                },
            })
            : null;
        const punch = evidence?.attendancePunches ?? null;
        const storage = evidence?.storageObjects ?? null;
        let selfieUrl = null;
        if (storage?.objectKey) {
            selfieUrl = await this.storageProvider.getUrl(storage.objectKey);
        }
        return {
            id: review.id,
            status: review.status,
            reviewedById: review.reviewedById,
            reviewedAt: review.reviewedAt,
            remarks: review.remarks,
            createdAt: review.createdAt,
            companyId: review.companyId,
            evidence: {
                id: evidence?.id,
                type: evidence?.type,
                punchId: evidence?.punchId,
                gpsAccuracy: evidence?.gpsAccuracy,
                mockLocationDetected: evidence?.mockLocationDetected,
                developerModeActive: evidence?.developerModeActive,
            },
            punch: punch
                ? {
                    id: punch.id,
                    punchType: punch.punchType,
                    timestamp: punch.timestamp,
                    latitude: punch.latitude,
                    longitude: punch.longitude,
                    deviceId: punch.deviceId,
                    locationId: punch.locationId,
                }
                : null,
            selfieUrl,
        };
    }
    async review(id, dto, companyId, reviewerId) {
        const review = await this.prisma.attendanceEvidenceReview.findUnique({
            where: { id },
        });
        if (!review || review.companyId !== companyId) {
            throw new common_1.NotFoundException('Evidence review not found');
        }
        if (review.status !== client_1.EvidenceReviewStatus.PENDING) {
            throw new common_1.ForbiddenException('Evidence review is not in PENDING status');
        }
        const updated = await this.prisma.attendanceEvidenceReview.update({
            where: { id },
            data: {
                status: dto.status,
                remarks: dto.remarks,
                reviewedById: reviewerId,
                reviewedAt: new Date(),
            },
        });
        const dayAggregateStatus = dto.status === client_1.EvidenceReviewStatus.APPROVED
            ? client_1.DayAggregateStatus.VERIFIED
            : client_1.DayAggregateStatus.FLAGGED;
        await this.prisma.$transaction(async (tx) => {
            if (review.punchId) {
                const punch = await tx.attendancePunch.findUnique({
                    where: { id: review.punchId },
                    select: { employeeId: true, companyId: true, timestamp: true },
                });
                if (punch) {
                    const company = await tx.company.findUnique({
                        where: { id: punch.companyId },
                        select: { settings: true },
                    });
                    const tz = (0, company_time_1.getCompanyTz)(company?.settings || null);
                    const punchInTz = new Date(punch.timestamp.toLocaleString('en-US', { timeZone: tz }));
                    const dayStart = new Date(Date.UTC(punchInTz.getFullYear(), punchInTz.getMonth(), punchInTz.getDate()));
                    const dayEnd = new Date(dayStart);
                    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
                    await tx.attendanceDayAggregate.updateMany({
                        where: {
                            companyId: punch.companyId,
                            employeeId: punch.employeeId,
                            date: { gte: dayStart, lt: dayEnd },
                        },
                        data: { status: dayAggregateStatus },
                    });
                }
            }
            await this.eventPublisher.publish(tx, {
                eventType: events_1.DomainEventTypes.ATTENDANCE_EVIDENCE_REVIEWED,
                entityId: updated.id,
                entityType: 'AttendanceEvidenceReview',
                companyId,
                payload: {
                    companyId,
                    evidenceId: updated.evidenceId,
                    punchId: updated.punchId,
                    status: updated.status,
                    remarks: updated.remarks,
                    reviewedById: reviewerId,
                },
            });
        });
        return updated;
    }
    async remove(id, companyId) {
        await this.findOne(id, companyId);
        await this.prisma.attendanceEvidenceReview.delete({ where: { id } });
        return { deleted: true };
    }
};
exports.EvidenceReviewService = EvidenceReviewService;
exports.EvidenceReviewService = EvidenceReviewService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)('STORAGE_PROVIDER')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        governance_event_publisher_1.GovernanceEventPublisher, Object])
], EvidenceReviewService);
//# sourceMappingURL=evidence-review.service.js.map