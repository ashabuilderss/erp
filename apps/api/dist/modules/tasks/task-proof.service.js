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
var TaskProofService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskProofService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
const transition_service_1 = require("../../common/services/transition.service");
const client_1 = require("@prisma/client");
const governance_event_publisher_1 = require("../governance-events/governance-event.publisher");
const events_1 = require("../governance-events/types/events");
let TaskProofService = TaskProofService_1 = class TaskProofService {
    prisma;
    transitionService;
    eventPublisher;
    logger = new common_1.Logger(TaskProofService_1.name);
    constructor(prisma, transitionService, eventPublisher) {
        this.prisma = prisma;
        this.transitionService = transitionService;
        this.eventPublisher = eventPublisher;
    }
    async submitProof(companyId, taskId, actorId, dto) {
        const actor = await this.prisma.employee.findFirst({
            where: { userId: actorId, companyId },
        });
        if (!actor)
            throw new common_1.BadRequestException('Employee not found.');
        return await this.prisma.$transaction(async (tx) => {
            const task = await tx.task.findFirst({
                where: { id: taskId, companyId, assigneeId: actor.id },
            });
            if (!task)
                throw new common_1.BadRequestException('Task not found or you are not the assignee.');
            if (task.status !== client_1.TaskStatus.IN_PROGRESS &&
                task.status !== client_1.TaskStatus.OVERDUE) {
                throw new common_1.BadRequestException('Task is not in a submittable state.');
            }
            this.transitionService.validate('Task', task.status, client_1.TaskStatus.PENDING_VALIDATION);
            const rejectedProofs = await tx.taskProof.count({
                where: { taskId, status: client_1.ApprovalStatus.REJECTED },
            });
            let isHrRouting = false;
            if (rejectedProofs >= 2) {
                isHrRouting = true;
            }
            const proof = await tx.taskProof.create({
                data: {
                    taskId,
                    companyId,
                    submissionUrl: dto.submissionUrl,
                    comments: dto.comments,
                    status: client_1.ApprovalStatus.PENDING,
                },
            });
            await tx.task.update({
                where: { id: taskId },
                data: { status: client_1.TaskStatus.PENDING_VALIDATION },
            });
            await tx.taskCompletionApproval.upsert({
                where: { taskId },
                create: {
                    companyId,
                    taskId,
                    proofId: proof.id,
                    status: client_1.TaskCompletionApprovalStatus.PENDING,
                },
                update: {
                    proofId: proof.id,
                    status: client_1.TaskCompletionApprovalStatus.PENDING,
                    managerAcknowledgedAt: null,
                    ownerApprovedAt: null,
                },
            });
            const eventStr = isHrRouting
                ? 'PROOF_SUBMITTED_ESCALATED_HR'
                : 'PROOF_SUBMITTED';
            const commentStr = isHrRouting
                ? '3-Strike Circuit Breaker activated. Validation routed to HR.'
                : 'Task proof submitted to Manager for validation.';
            await tx.taskHistory.create({
                data: {
                    taskId,
                    companyId,
                    actorId: actor.id,
                    event: eventStr,
                    comments: commentStr,
                },
            });
            return proof;
        });
    }
    async acknowledgeCompletion(companyId, proofId, actorId, dto) {
        const actor = await this.prisma.employee.findFirst({
            where: { userId: actorId, companyId },
        });
        if (!actor)
            throw new common_1.BadRequestException('Reviewer not found.');
        return await this.prisma.$transaction(async (tx) => {
            const proof = await tx.taskProof.findFirst({
                where: { id: proofId, status: client_1.ApprovalStatus.PENDING },
                include: { tasks: true },
            });
            if (!proof)
                throw new common_1.BadRequestException('Pending proof not found.');
            const approval = await tx.taskCompletionApproval.upsert({
                where: { taskId: proof.taskId },
                create: {
                    companyId,
                    taskId: proof.taskId,
                    proofId: proof.id,
                    status: client_1.TaskCompletionApprovalStatus.MANAGER_ACKNOWLEDGED,
                    managerId: actor.id,
                    managerAcknowledgedAt: new Date(),
                    comments: dto.comments,
                },
                update: {
                    status: client_1.TaskCompletionApprovalStatus.MANAGER_ACKNOWLEDGED,
                    managerId: actor.id,
                    managerAcknowledgedAt: new Date(),
                    comments: dto.comments,
                },
            });
            await tx.taskHistory.create({
                data: {
                    taskId: proof.taskId,
                    companyId,
                    actorId: actor.id,
                    event: 'PROOF_ACKNOWLEDGED_BY_MANAGER',
                    comments: dto.comments || 'Completion acknowledged by manager.',
                },
            });
            await this.eventPublisher?.publish(tx, {
                eventType: events_1.DomainEventTypes.TASK_COMPLETION_ACKNOWLEDGED,
                entityId: proof.taskId,
                entityType: 'Task',
                companyId,
                payload: {
                    companyId,
                    taskId: proof.taskId,
                    proofId: proof.id,
                    approvalId: approval.id,
                },
            });
            return {
                success: true,
                message: 'Completion acknowledged by manager. Awaiting Owner approval.',
            };
        });
    }
    async approveCompletion(companyId, proofId, actorId, dto) {
        const actor = await this.prisma.employee.findFirst({
            where: { userId: actorId, companyId },
        });
        if (!actor)
            throw new common_1.BadRequestException('Reviewer not found.');
        return await this.prisma.$transaction(async (tx) => {
            const proof = await tx.taskProof.findFirst({
                where: { id: proofId },
                include: { tasks: true },
            });
            if (!proof)
                throw new common_1.BadRequestException('Proof not found.');
            const approval = await tx.taskCompletionApproval.findFirst({
                where: { taskId: proof.taskId },
            });
            if (!approval ||
                approval.status !== client_1.TaskCompletionApprovalStatus.MANAGER_ACKNOWLEDGED) {
                throw new common_1.BadRequestException('Completion must be acknowledged by a manager before Owner approval.');
            }
            this.transitionService.validate('Task', proof.tasks.status, client_1.TaskStatus.COMPLETED);
            await tx.taskProof.update({
                where: { id: proofId },
                data: {
                    status: client_1.ApprovalStatus.APPROVED,
                    reviewerId: actor.id,
                    reviewedAt: new Date(),
                    reviewerComments: dto.comments,
                },
            });
            await tx.task.update({
                where: { id: proof.taskId },
                data: { status: client_1.TaskStatus.COMPLETED },
            });
            await tx.taskCompletionApproval.update({
                where: { id: approval.id },
                data: {
                    status: client_1.TaskCompletionApprovalStatus.APPROVED,
                    ownerId: actor.id,
                    ownerApprovedAt: new Date(),
                    comments: dto.comments,
                },
            });
            await tx.taskHistory.create({
                data: {
                    taskId: proof.taskId,
                    companyId,
                    actorId: actor.id,
                    event: 'PROOF_APPROVED_BY_OWNER',
                    comments: dto.comments || 'Completion approved by Owner.',
                },
            });
            await this.eventPublisher?.publish(tx, {
                eventType: events_1.DomainEventTypes.TASK_COMPLETION_APPROVED,
                entityId: proof.taskId,
                entityType: 'Task',
                companyId,
                payload: {
                    companyId,
                    taskId: proof.taskId,
                    proofId: proof.id,
                    approvalId: approval.id,
                },
            });
            await this.eventPublisher?.publish(tx, {
                eventType: events_1.DomainEventTypes.TASK_COMPLETED,
                entityId: proof.taskId,
                entityType: 'Task',
                companyId,
                payload: {
                    companyId,
                    taskId: proof.taskId,
                },
            });
            return { success: true, message: 'Completion approved by Owner' };
        });
    }
    async rejectCompletion(companyId, proofId, actorId, dto) {
        const actor = await this.prisma.employee.findFirst({
            where: { userId: actorId, companyId },
        });
        if (!actor)
            throw new common_1.BadRequestException('Reviewer not found.');
        return await this.prisma.$transaction(async (tx) => {
            const proof = await tx.taskProof.findFirst({
                where: { id: proofId, status: client_1.ApprovalStatus.PENDING },
                include: { tasks: true },
            });
            if (!proof)
                throw new common_1.BadRequestException('Pending proof not found.');
            this.transitionService.validate('Task', proof.tasks.status, client_1.TaskStatus.IN_PROGRESS);
            await tx.taskProof.update({
                where: { id: proofId },
                data: {
                    status: client_1.ApprovalStatus.REJECTED,
                    reviewerId: actor.id,
                    reviewedAt: new Date(),
                    reviewerComments: dto.comments,
                },
            });
            await tx.task.update({
                where: { id: proof.taskId },
                data: { status: client_1.TaskStatus.IN_PROGRESS },
            });
            await tx.taskCompletionApproval.update({
                where: { taskId: proof.taskId },
                data: { status: client_1.TaskCompletionApprovalStatus.REJECTED },
            });
            await tx.taskHistory.create({
                data: {
                    taskId: proof.taskId,
                    companyId,
                    actorId: actor.id,
                    event: 'PROOF_REJECTED',
                    comments: dto.comments || 'Proof rejected.',
                },
            });
            await this.eventPublisher?.publish(tx, {
                eventType: events_1.DomainEventTypes.TASK_PROOF_REJECTED,
                entityId: proof.taskId,
                entityType: 'Task',
                companyId,
                payload: {
                    companyId,
                    taskId: proof.taskId,
                    proofId: proof.id,
                },
            });
            return { success: true, message: 'Proof rejected' };
        });
    }
};
exports.TaskProofService = TaskProofService;
exports.TaskProofService = TaskProofService = TaskProofService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        transition_service_1.TransitionService,
        governance_event_publisher_1.GovernanceEventPublisher])
], TaskProofService);
//# sourceMappingURL=task-proof.service.js.map