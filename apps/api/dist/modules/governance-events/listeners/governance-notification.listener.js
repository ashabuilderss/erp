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
var GovernanceNotificationListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GovernanceNotificationListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const governance_event_processor_1 = require("../governance-event.processor");
const events_1 = require("../types/events");
const prisma_service_1 = require("../../../config/prisma.service");
const notifications_service_1 = require("../../notifications/notifications.service");
let GovernanceNotificationListener = GovernanceNotificationListener_1 = class GovernanceNotificationListener {
    processor;
    prisma;
    notificationsService;
    logger = new common_1.Logger(GovernanceNotificationListener_1.name);
    constructor(processor, prisma, notificationsService) {
        this.processor = processor;
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    async handleTaskCompleted(event) {
        await this.processor.process(event, 'GovernanceNotificationListener_handleTaskCompleted', async () => {
            const taskId = event.entityId;
            const companyId = event.payload?.companyId ?? '';
            const task = await this.prisma.task.findUnique({
                where: { id: taskId },
                select: { title: true, creatorId: true },
            });
            if (!task)
                return;
            const creatorEmployee = await this.prisma.employee.findUnique({
                where: { id: task.creatorId },
                select: { userId: true },
            });
            const creatorUserId = creatorEmployee?.userId;
            if (!creatorUserId)
                return;
            await this.notificationsService.create({
                companyId,
                userId: creatorUserId,
                title: 'Task completed',
                message: `Task "${task.title}" has been marked as completed.`,
                type: 'TASK',
                link: `/dashboard/my-tasks/${taskId}`,
            });
        });
    }
    async handleTaskCompletionAcknowledged(event) {
        await this.processor.process(event, 'GovernanceNotificationListener_handleTaskCompletionAcknowledged', async () => {
            const taskId = event.entityId;
            const companyId = event.payload?.companyId ?? '';
            const task = await this.prisma.task.findUnique({
                where: { id: taskId },
                select: { title: true },
            });
            if (!task)
                return;
            const owners = await this.prisma.user.findMany({
                where: { companyId, role: 'OWNER', deletedAt: null },
                select: { id: true },
            });
            for (const owner of owners) {
                await this.notificationsService.create({
                    companyId,
                    userId: owner.id,
                    title: 'Approve completion',
                    message: `Task "${task.title}" has been acknowledged by a manager. Please approve completion.`,
                    type: 'TASK',
                    link: `/dashboard/my-tasks/${taskId}`,
                });
            }
        });
    }
    async handleDocumentUploaded(event) {
        await this.processor.process(event, 'GovernanceNotificationListener_handleDocumentUploaded', async () => {
            const companyId = event.payload?.companyId ?? '';
            const { name, uploadedById } = event.payload;
            const label = name ? `"${name}"` : 'A document';
            await this.notifyOwners(companyId, 'Document uploaded', `${label} was uploaded to the document registry.`, '/dashboard/documents', uploadedById);
        });
    }
    async handleDocumentDeleted(event) {
        await this.processor.process(event, 'GovernanceNotificationListener_handleDocumentDeleted', async () => {
            const companyId = event.payload?.companyId ?? '';
            const { name, deletedById } = event.payload;
            const label = name ? `"${name}"` : 'A document';
            await this.notifyOwners(companyId, 'Document deleted', `${label} was deleted from the document registry.`, '/dashboard/documents', deletedById);
        });
    }
    async handleLeadStatusChanged(event) {
        await this.processor.process(event, 'GovernanceNotificationListener_handleLeadStatusChanged', async () => {
            const companyId = event.payload?.companyId ?? '';
            const { metadata, userId } = event.payload;
            const name = metadata?.leadName ?? 'A lead';
            const from = metadata?.previousStatus ?? 'previous';
            const to = metadata?.newStatus ?? 'new';
            await this.notifyOwners(companyId, 'Lead status changed', `${name} moved from ${from} to ${to}.`, '/dashboard/leads', userId);
        });
    }
    async handleSiteVisitCompleted(event) {
        await this.processor.process(event, 'GovernanceNotificationListener_handleSiteVisitCompleted', async () => {
            const companyId = event.payload?.companyId ?? '';
            const userId = event.payload?.userId;
            await this.notifyOwners(companyId, 'Site visit completed', 'A scheduled site visit has been marked as completed.', '/dashboard/site-visits', userId);
        });
    }
    async handleBookingCreated(event) {
        await this.processor.process(event, 'GovernanceNotificationListener_handleBookingCreated', async () => {
            const companyId = event.payload?.companyId ?? '';
            const { metadata, userId } = event.payload;
            const property = metadata?.propertyTitle ?? 'a property';
            const customer = metadata?.customerName ?? 'a customer';
            await this.notifyOwners(companyId, 'Booking created', `A booking for ${property} (${customer}) was created.`, '/dashboard/bookings', userId);
        });
    }
    async handlePropertyCreated(event) {
        await this.processor.process(event, 'GovernanceNotificationListener_handlePropertyCreated', async () => {
            const companyId = event.payload?.companyId ?? '';
            const { metadata, userId } = event.payload;
            const title = metadata?.title ?? 'A property';
            await this.notifyOwners(companyId, 'Property added', `${title} was added to the property portfolio.`, '/dashboard/properties', userId);
        });
    }
    async handlePropertyStatusChanged(event) {
        await this.processor.process(event, 'GovernanceNotificationListener_handlePropertyStatusChanged', async () => {
            const companyId = event.payload?.companyId ?? '';
            const { metadata, userId } = event.payload;
            const title = metadata?.title ?? 'A property';
            const from = metadata?.previousStatus ?? 'previous';
            const to = metadata?.newStatus ?? 'new';
            await this.notifyOwners(companyId, 'Property status changed', `${title} moved from ${from} to ${to}.`, '/dashboard/properties', userId);
        });
    }
    async handlePayrollProcessed(event) {
        await this.processor.process(event, 'GovernanceNotificationListener_handlePayrollProcessed', async () => {
            const companyId = event.payload?.companyId ?? '';
            const { employeeCount, totalNetPay, heldEmployeeCount } = event.payload;
            await this.notifyOwners(companyId, 'Payroll processed', `A payroll run was processed for ${employeeCount ?? 0} employees (net ${totalNetPay ?? 0}). ${heldEmployeeCount ? `${heldEmployeeCount} excluded by holds.` : ''}`, '/dashboard/payroll');
        });
    }
    async handleAttendanceFinalized(event) {
        await this.processor.process(event, 'GovernanceNotificationListener_handleAttendanceFinalized', async () => {
            const companyId = event.payload?.companyId ?? '';
            const { finalized } = event.payload;
            const count = Array.isArray(finalized) ? finalized.length : 0;
            await this.notifyOwners(companyId, 'Attendance finalized', `An attendance period was finalized for ${count} employees.`, '/dashboard/attendance');
        });
    }
    async notifyOwners(companyId, title, message, link, actorUserId) {
        if (!companyId)
            return;
        const owners = await this.prisma.user.findMany({
            where: { companyId, role: 'OWNER', deletedAt: null },
            select: { id: true },
        });
        for (const owner of owners) {
            if (actorUserId && owner.id === actorUserId)
                continue;
            await this.notificationsService.create({
                companyId,
                userId: owner.id,
                title,
                message,
                type: 'SYSTEM',
                link,
            });
        }
    }
    async handleApprovalApproved(event) {
        await this.onApprovalOutcome(event, 'approved', 'APPROVAL_APPROVED');
    }
    async handleApprovalRejected(event) {
        await this.onApprovalOutcome(event, 'rejected', 'APPROVAL_REJECTED');
    }
    async onApprovalOutcome(event, outcome, handlerName) {
        await this.processor.process(event, `GovernanceNotificationListener_${handlerName}`, async () => {
            const companyId = event.payload?.companyId ?? '';
            const entityType = event.entityType ?? '';
            const approvalRequest = await this.prisma.approvalRequest.findFirst({
                where: {
                    companyId,
                    entityType,
                    entityId: event.entityId,
                },
                select: { createdById: true },
            });
            if (!approvalRequest)
                return;
            const label = entityType ? entityType.toLowerCase() : 'request';
            await this.notificationsService.create({
                companyId,
                userId: approvalRequest.createdById,
                title: `Your ${label} request was ${outcome}`,
                message: `Your request to approve the ${label} has been ${outcome}.`,
                type: 'APPROVAL',
                link: `/dashboard/approvals`,
            });
        });
    }
    async handlePayrollHoldReleaseRequested(event) {
        await this.processor.process(event, 'GovernanceNotificationListener_handlePayrollHoldReleaseRequested', async () => {
            const companyId = event.payload?.companyId ?? '';
            const holdId = event.entityId;
            const hold = await this.prisma.payrollHold.findUnique({
                where: { id: holdId },
                select: { employeeId: true },
            });
            if (!hold)
                return;
            const employee = await this.prisma.employee.findUnique({
                where: { id: hold.employeeId },
                select: { userId: true },
            });
            const userId = employee?.userId;
            if (!userId)
                return;
            await this.notificationsService.create({
                companyId,
                userId,
                title: 'Payroll hold release requested',
                message: 'A release has been requested for a payroll hold on your account. A manager will review it shortly.',
                type: 'PAYROLL',
                link: `/dashboard/payroll-holds`,
            });
        });
    }
};
exports.GovernanceNotificationListener = GovernanceNotificationListener;
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.TASK_COMPLETED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GovernanceNotificationListener.prototype, "handleTaskCompleted", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.TASK_COMPLETION_ACKNOWLEDGED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GovernanceNotificationListener.prototype, "handleTaskCompletionAcknowledged", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.DOCUMENT_UPLOADED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GovernanceNotificationListener.prototype, "handleDocumentUploaded", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.DOCUMENT_DELETED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GovernanceNotificationListener.prototype, "handleDocumentDeleted", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.LEAD_STATUS_CHANGED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GovernanceNotificationListener.prototype, "handleLeadStatusChanged", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.SITE_VISIT_COMPLETED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GovernanceNotificationListener.prototype, "handleSiteVisitCompleted", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.BOOKING_CREATED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GovernanceNotificationListener.prototype, "handleBookingCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.PROPERTY_CREATED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GovernanceNotificationListener.prototype, "handlePropertyCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.PROPERTY_STATUS_CHANGED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GovernanceNotificationListener.prototype, "handlePropertyStatusChanged", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.PAYROLL_PROCESSED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GovernanceNotificationListener.prototype, "handlePayrollProcessed", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.ATTENDANCE_FINALIZED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GovernanceNotificationListener.prototype, "handleAttendanceFinalized", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.APPROVAL_APPROVED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GovernanceNotificationListener.prototype, "handleApprovalApproved", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.APPROVAL_REJECTED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GovernanceNotificationListener.prototype, "handleApprovalRejected", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.PAYROLL_HOLD_RELEASE_REQUESTED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GovernanceNotificationListener.prototype, "handlePayrollHoldReleaseRequested", null);
exports.GovernanceNotificationListener = GovernanceNotificationListener = GovernanceNotificationListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [governance_event_processor_1.GovernanceEventProcessor,
        prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], GovernanceNotificationListener);
//# sourceMappingURL=governance-notification.listener.js.map