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
var ApprovalsRuntimeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalsRuntimeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
const client_1 = require("@prisma/client");
const governance_event_publisher_1 = require("../governance-events/governance-event.publisher");
const events_1 = require("../governance-events/types/events");
let ApprovalsRuntimeService = ApprovalsRuntimeService_1 = class ApprovalsRuntimeService {
    prisma;
    eventPublisher;
    logger = new common_1.Logger(ApprovalsRuntimeService_1.name);
    constructor(prisma, eventPublisher) {
        this.prisma = prisma;
        this.eventPublisher = eventPublisher;
    }
    async verifyDelegation(authorizerId, requiredUserId) {
        if (authorizerId === requiredUserId)
            return true;
        const authorizerEmployee = await this.prisma.employee.findFirst({
            where: { userId: authorizerId },
        });
        const requiredEmployee = await this.prisma.employee.findFirst({
            where: { userId: requiredUserId },
        });
        if (!authorizerEmployee || !requiredEmployee)
            return false;
        const now = new Date();
        const delegation = await this.prisma.delegation.findFirst({
            where: {
                delegatorId: requiredEmployee.id,
                delegateId: authorizerEmployee.id,
                isActive: true,
                validFrom: { lte: now },
                validTo: { gte: now },
            },
        });
        return !!delegation;
    }
    async approveStep(requestId, userId, comments) {
        return await this.prisma.$transaction(async (tx) => {
            const request = await tx.approvalRequest.findFirst({
                where: { id: requestId, status: client_1.ApprovalStatus.PENDING },
                include: { approvalSteps: { orderBy: { sequence: 'asc' } } },
            });
            if (!request) {
                throw new common_1.BadRequestException('Approval request is not pending.');
            }
            const currentStep = request.approvalSteps.find((s) => s.status === client_1.ApprovalStatus.PENDING);
            if (!currentStep) {
                throw new common_1.BadRequestException('No pending steps found for this request.');
            }
            if (currentStep.requiredUserId) {
                const isAuthorized = await this.verifyDelegation(userId, currentStep.requiredUserId);
                if (!isAuthorized) {
                    throw new common_1.BadRequestException('User is not authorized to approve this step.');
                }
            }
            const updatedStep = await tx.approvalStep.updateMany({
                where: { id: currentStep.id, status: client_1.ApprovalStatus.PENDING },
                data: { status: client_1.ApprovalStatus.APPROVED },
            });
            if (updatedStep.count === 0) {
                throw new common_1.BadRequestException('Concurrency error: step was already modified.');
            }
            await tx.approvalHistory.create({
                data: {
                    companyId: request.companyId,
                    requestId,
                    stepId: currentStep.id,
                    action: 'APPROVED',
                    comments: comments || `Approved by user ${userId}`,
                },
            });
            const hasMoreSteps = request.approvalSteps.some((s) => s.sequence > currentStep.sequence);
            if (!hasMoreSteps) {
                await tx.approvalRequest.updateMany({
                    where: { id: requestId, status: client_1.ApprovalStatus.PENDING },
                    data: { status: client_1.ApprovalStatus.APPROVED },
                });
                await tx.approvalHistory.create({
                    data: {
                        companyId: request.companyId,
                        requestId,
                        action: 'REQUEST_APPROVED',
                        comments: 'All steps completed. Request is approved.',
                    },
                });
                await this.eventPublisher.publish(tx, {
                    correlationId: requestId,
                    eventType: events_1.DomainEventTypes.APPROVAL_APPROVED,
                    entityId: request.entityId,
                    entityType: request.entityType,
                    companyId: request.companyId,
                    payload: {
                        companyId: request.companyId,
                        requestId,
                        entityType: request.entityType,
                        entityId: request.entityId,
                        approvedBy: userId,
                        comments: comments || null,
                    },
                });
            }
            return { success: true, message: 'Step approved successfully.' };
        });
    }
    async rejectStep(requestId, userId, comments) {
        return await this.prisma.$transaction(async (tx) => {
            const request = await tx.approvalRequest.findFirst({
                where: { id: requestId, status: client_1.ApprovalStatus.PENDING },
                include: { approvalSteps: { orderBy: { sequence: 'asc' } } },
            });
            if (!request) {
                throw new common_1.BadRequestException('Approval request is not pending.');
            }
            const currentStep = request.approvalSteps.find((s) => s.status === client_1.ApprovalStatus.PENDING);
            if (!currentStep) {
                throw new common_1.BadRequestException('No pending steps found.');
            }
            if (currentStep.requiredUserId) {
                const isAuthorized = await this.verifyDelegation(userId, currentStep.requiredUserId);
                if (!isAuthorized) {
                    throw new common_1.BadRequestException('User is not authorized to reject this step.');
                }
            }
            const updatedStep = await tx.approvalStep.updateMany({
                where: { id: currentStep.id, status: client_1.ApprovalStatus.PENDING },
                data: { status: client_1.ApprovalStatus.REJECTED },
            });
            if (updatedStep.count === 0) {
                throw new common_1.BadRequestException('Concurrency error: step was already modified.');
            }
            await tx.approvalRequest.update({
                where: { id: requestId },
                data: { status: client_1.ApprovalStatus.REJECTED },
            });
            await tx.approvalHistory.create({
                data: {
                    companyId: request.companyId,
                    requestId,
                    stepId: currentStep.id,
                    action: 'REJECTED',
                    comments: comments || `Rejected by user ${userId}`,
                },
            });
            await this.eventPublisher.publish(tx, {
                correlationId: requestId,
                eventType: events_1.DomainEventTypes.APPROVAL_REJECTED,
                entityId: request.entityId,
                entityType: request.entityType,
                companyId: request.companyId,
                payload: {
                    companyId: request.companyId,
                    requestId,
                    entityType: request.entityType,
                    entityId: request.entityId,
                    rejectedBy: userId,
                    comments: comments || null,
                },
            });
            return { success: true, message: 'Step and request rejected.' };
        });
    }
    async overrideRequest(requestId, userId, reason) {
        if (!reason || reason.trim() === '') {
            throw new common_1.BadRequestException('Override requires a mandatory reason.');
        }
        return await this.prisma.$transaction(async (tx) => {
            const request = await tx.approvalRequest.findFirst({
                where: {
                    id: requestId,
                    status: { in: [client_1.ApprovalStatus.PENDING, client_1.ApprovalStatus.ESCALATED] },
                },
            });
            if (!request) {
                throw new common_1.BadRequestException('Request is not in an overridable state.');
            }
            const updatedReq = await tx.approvalRequest.updateMany({
                where: { id: requestId, status: request.status },
                data: { status: client_1.ApprovalStatus.APPROVED },
            });
            if (updatedReq.count === 0) {
                throw new common_1.BadRequestException('Concurrency error on override.');
            }
            await tx.approvalStep.updateMany({
                where: { requestId, status: client_1.ApprovalStatus.PENDING },
                data: { status: client_1.ApprovalStatus.CANCELLED },
            });
            await tx.approvalHistory.create({
                data: {
                    companyId: request.companyId,
                    requestId,
                    action: 'OWNER_OVERRIDE',
                    comments: `Owner Bypass Override. Reason: ${reason}`,
                },
            });
            await this.eventPublisher.publish(tx, {
                correlationId: requestId,
                eventType: events_1.DomainEventTypes.APPROVAL_OVERRIDDEN,
                entityId: request.entityId,
                entityType: request.entityType,
                companyId: request.companyId,
                payload: {
                    companyId: request.companyId,
                    requestId,
                    entityType: request.entityType,
                    entityId: request.entityId,
                    overriddenBy: userId,
                    reason,
                },
            });
            return {
                success: true,
                message: 'Request bypassed and approved by owner.',
            };
        });
    }
    async escalateRequest(requestId) {
        return await this.prisma.$transaction(async (tx) => {
            const request = await tx.approvalRequest.findFirst({
                where: { id: requestId, status: client_1.ApprovalStatus.PENDING },
                include: { approvalSteps: { orderBy: { sequence: 'asc' } } },
            });
            if (!request)
                return;
            const currentStep = request.approvalSteps.find((s) => s.status === client_1.ApprovalStatus.PENDING);
            if (!currentStep)
                return;
            await tx.approvalStep.update({
                where: { id: currentStep.id },
                data: { escalationLevel: currentStep.escalationLevel + 1 },
            });
            await tx.approvalRequest.update({
                where: { id: requestId },
                data: { status: client_1.ApprovalStatus.ESCALATED },
            });
            await tx.approvalHistory.create({
                data: {
                    companyId: request.companyId,
                    requestId,
                    stepId: currentStep.id,
                    action: 'ESCALATED',
                    comments: 'Request escalated due to SLA breach.',
                },
            });
        });
    }
};
exports.ApprovalsRuntimeService = ApprovalsRuntimeService;
exports.ApprovalsRuntimeService = ApprovalsRuntimeService = ApprovalsRuntimeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        governance_event_publisher_1.GovernanceEventPublisher])
], ApprovalsRuntimeService);
//# sourceMappingURL=approvals-runtime.service.js.map