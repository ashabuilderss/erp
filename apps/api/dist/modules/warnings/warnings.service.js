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
var WarningsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarningsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
const client_1 = require("@prisma/client");
const governance_event_publisher_1 = require("../governance-events/governance-event.publisher");
const events_1 = require("../governance-events/types/events");
const approvals_1 = require("../approvals");
let WarningsService = WarningsService_1 = class WarningsService {
    prisma;
    spawningService;
    eventPublisher;
    logger = new common_1.Logger(WarningsService_1.name);
    constructor(prisma, spawningService, eventPublisher) {
        this.prisma = prisma;
        this.spawningService = spawningService;
        this.eventPublisher = eventPublisher;
    }
    async issueWarning(companyId, issuerUserId, dto) {
        const issuer = await this.prisma.employee.findFirst({
            where: { userId: issuerUserId, companyId },
        });
        if (!issuer && !dto.isSystemGenerated) {
            throw new common_1.BadRequestException('Issuer not found.');
        }
        const employee = await this.prisma.employee.findFirst({
            where: { id: dto.employeeId, companyId },
        });
        if (!employee)
            throw new common_1.BadRequestException('Employee not found.');
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
        });
        const settings = company?.settings || {};
        let expirationMonths = 6;
        if (dto.severity === client_1.WarningSeverity.LEVEL_1_VERBAL) {
            expirationMonths = settings.warningLevel1ExpiryMonths || 3;
        }
        else if (dto.severity === client_1.WarningSeverity.LEVEL_2_WRITTEN) {
            expirationMonths = settings.warningLevel2ExpiryMonths || 6;
        }
        else if (dto.severity === client_1.WarningSeverity.LEVEL_3_FINAL) {
            expirationMonths = settings.warningLevel3ExpiryMonths || 12;
        }
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + expirationMonths);
        return await this.prisma.$transaction(async (tx) => {
            const status = dto.severity === client_1.WarningSeverity.LEVEL_1_VERBAL
                ? client_1.ApprovalStatus.APPROVED
                : client_1.ApprovalStatus.PENDING;
            const warning = await tx.warning.create({
                data: {
                    companyId,
                    employeeId: employee.id,
                    issuerId: dto.isSystemGenerated ? null : issuer?.id,
                    category: dto.category,
                    severity: dto.severity,
                    reason: dto.reason,
                    isSystemGenerated: dto.isSystemGenerated || false,
                    status,
                    expiresAt,
                },
            });
            await tx.warningHistory.create({
                data: {
                    warningId: warning.id,
                    companyId,
                    actorId: issuer?.id,
                    event: 'WARNING_ISSUED',
                    comments: `Warning created. Severity: ${dto.severity}, Category: ${dto.category}.`,
                },
            });
            if (dto.severity !== client_1.WarningSeverity.LEVEL_1_VERBAL) {
                const approvalReq = await this.spawningService.spawnRequest(companyId, 'WARNING_APPROVAL', warning.id, issuerUserId);
                await tx.warning.update({
                    where: { id: warning.id },
                    data: { approvalId: approvalReq.id },
                });
            }
            await this.evaluateAccumulationLogic(tx, companyId, employee.id, dto.category, warning.id, issuerUserId);
            return warning;
        });
    }
    async evaluateAccumulationLogic(tx, companyId, employeeId, category, currentWarningId, issuerUserId) {
        const now = new Date();
        const activeWarnings = await tx.warning.findMany({
            where: {
                companyId,
                employeeId,
                category,
                expiresAt: { gt: now },
                status: { in: [client_1.ApprovalStatus.APPROVED, client_1.ApprovalStatus.PENDING] },
            },
        });
        const level1Count = activeWarnings.filter((w) => w.severity === client_1.WarningSeverity.LEVEL_1_VERBAL).length;
        const level2Count = activeWarnings.filter((w) => w.severity === client_1.WarningSeverity.LEVEL_2_WRITTEN).length;
        let triggerReview = false;
        let reviewReason = '';
        if (level1Count >= 3) {
            triggerReview = true;
            reviewReason = `Accumulated 3 Level 1 Warnings in category ${category}.`;
        }
        else if (level2Count >= 2) {
            triggerReview = true;
            reviewReason = `Accumulated 2 Level 2 Warnings in category ${category}.`;
        }
        if (triggerReview) {
            const existingReview = await tx.approvalRequest.findFirst({
                where: {
                    companyId,
                    entityType: 'DISCIPLINARY_REVIEW',
                    entityId: employeeId,
                    status: client_1.ApprovalStatus.PENDING,
                },
            });
            if (!existingReview) {
                await tx.warningHistory.create({
                    data: {
                        warningId: currentWarningId,
                        event: 'DISCIPLINARY_REVIEW_TRIGGERED',
                        comments: reviewReason,
                    },
                });
                await this.spawningService.spawnRequest(companyId, 'DISCIPLINARY_REVIEW', employeeId, issuerUserId);
                await this.eventPublisher.publish(tx, {
                    eventType: events_1.DomainEventTypes.WARNING_THRESHOLD_BREACHED,
                    entityId: employeeId,
                    entityType: 'EMPLOYEE',
                    companyId,
                    payload: {
                        companyId,
                        employeeId,
                        warningId: currentWarningId,
                        reason: reviewReason,
                    },
                });
            }
        }
    }
    async acknowledgeWarning(companyId, warningId, actorUserId) {
        const actor = await this.prisma.employee.findFirst({
            where: { userId: actorUserId, companyId },
        });
        return await this.prisma.$transaction(async (tx) => {
            const warning = await tx.warning.findFirst({
                where: { id: warningId, companyId },
            });
            if (!warning)
                throw new common_1.BadRequestException('Warning not found.');
            if (actor && warning.employeeId !== actor.id) {
                throw new common_1.BadRequestException('Only the recipient can acknowledge this warning.');
            }
            if (warning.status !== client_1.ApprovalStatus.APPROVED) {
                throw new common_1.BadRequestException('Warning must be APPROVED before acknowledgment.');
            }
            if (warning.acknowledgedAt) {
                throw new common_1.BadRequestException('Warning already acknowledged.');
            }
            const updated = await tx.warning.update({
                where: { id: warning.id },
                data: { acknowledgedAt: new Date() },
            });
            await tx.warningHistory.create({
                data: {
                    warningId: warning.id,
                    companyId: warning.companyId,
                    actorId: actor?.id,
                    event: 'WARNING_ACKNOWLEDGED',
                    comments: 'Warning acknowledged by employee.',
                },
            });
            return updated;
        });
    }
    async findAll(companyId, query) {
        const { page = 1, limit = 10, employeeId, severity, status } = query;
        const skip = (page - 1) * limit;
        const where = {
            companyId,
            ...(employeeId ? { employeeId } : {}),
            ...(severity ? { severity } : {}),
            ...(status ? { status } : {}),
        };
        const [items, total] = await Promise.all([
            this.prisma.warning.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    employeesWarningsEmployeeIdToemployees: { include: { users: true } },
                    employeesWarningsIssuerIdToemployees: { include: { users: true } },
                },
            }),
            this.prisma.warning.count({ where }),
        ]);
        return {
            items,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        };
    }
    async findMyWarnings(companyId, userId, query) {
        const employee = await this.prisma.employee.findFirst({
            where: { userId, companyId },
        });
        if (!employee) {
            throw new common_1.BadRequestException('Employee profile not found.');
        }
        query.employeeId = employee.id;
        if (!query.status) {
            query.status = client_1.ApprovalStatus.APPROVED;
        }
        return this.findAll(companyId, query);
    }
    async findOne(companyId, id) {
        const warning = await this.prisma.warning.findFirst({
            where: { id, companyId },
            include: {
                employeesWarningsEmployeeIdToemployees: { include: { users: true } },
                employeesWarningsIssuerIdToemployees: { include: { users: true } },
                warningHistories: {
                    orderBy: { createdAt: 'desc' },
                    include: { employees: { include: { users: true } } },
                },
            },
        });
        if (!warning)
            throw new common_1.BadRequestException('Warning not found');
        return warning;
    }
};
exports.WarningsService = WarningsService;
exports.WarningsService = WarningsService = WarningsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        approvals_1.ApprovalsSpawningService,
        governance_event_publisher_1.GovernanceEventPublisher])
], WarningsService);
//# sourceMappingURL=warnings.service.js.map