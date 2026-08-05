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
var AttendanceEvidenceReviewListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceEvidenceReviewListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const governance_event_processor_1 = require("../governance-event.processor");
const events_1 = require("../types/events");
const prisma_service_1 = require("../../../config/prisma.service");
const notifications_service_1 = require("../../notifications/notifications.service");
let AttendanceEvidenceReviewListener = AttendanceEvidenceReviewListener_1 = class AttendanceEvidenceReviewListener {
    processor;
    prisma;
    notificationsService;
    logger = new common_1.Logger(AttendanceEvidenceReviewListener_1.name);
    constructor(processor, prisma, notificationsService) {
        this.processor = processor;
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    async handleEvidencePending(event) {
        await this.processor.process(event, 'AttendanceEvidenceReviewListener_handleEvidencePending', async () => {
            const payload = event.payload;
            const evidence = await this.prisma.attendanceEvidence.findUnique({
                where: { id: event.entityId },
                select: { punchId: true, companyId: true },
            });
            if (!evidence) {
                this.logger.warn(`Evidence ${event.entityId} not found`);
                return;
            }
            const employeeId = evidence.punchId
                ? (await this.prisma.attendancePunch.findUnique({
                    where: { id: evidence.punchId },
                    select: { employeeId: true },
                }))?.employeeId
                : null;
            const companyId = evidence.companyId || payload?.companyId || '';
            const hrUsers = await this.prisma.user.findMany({
                where: {
                    companyId,
                    role: { in: ['OWNER', 'HR_MANAGER'] },
                    deletedAt: null,
                },
                select: { id: true },
            });
            for (const user of hrUsers) {
                await this.notificationsService.create({
                    userId: user.id,
                    companyId,
                    title: 'Attendance Evidence Awaiting Review',
                    message: `A punch-in/out selfie for employee ${employeeId ?? 'N/A'} requires review.`,
                    type: 'INFO',
                    link: '/dashboard/attendance?tab=evidence-queue',
                });
            }
        });
    }
    async handleEvidenceReviewed(event) {
        await this.processor.process(event, 'AttendanceEvidenceReviewListener_handleEvidenceReviewed', async () => {
            const payload = event.payload;
            const review = await this.prisma.attendanceEvidenceReview.findUnique({
                where: { id: event.entityId },
                select: {
                    evidenceId: true,
                    punchId: true,
                    companyId: true,
                    status: true,
                    remarks: true,
                },
            });
            if (!review) {
                this.logger.warn(`Evidence review ${event.entityId} not found`);
                return;
            }
            const companyId = review.companyId;
            const status = payload?.status ?? review.status;
            const remarks = payload?.remarks ?? review.remarks ?? '';
            const reviewerId = payload?.reviewedById;
            let employeeUserId = null;
            if (review.punchId) {
                const punch = await this.prisma.attendancePunch.findUnique({
                    where: { id: review.punchId },
                    select: { employeeId: true },
                });
                if (punch?.employeeId) {
                    const employee = await this.prisma.employee.findUnique({
                        where: { id: punch.employeeId },
                        select: { userId: true },
                    });
                    employeeUserId = employee?.userId ?? null;
                }
            }
            if (employeeUserId) {
                const isApproved = status === 'APPROVED';
                const title = isApproved
                    ? 'Attendance Evidence Approved'
                    : `Attendance Evidence ${status.charAt(0) + status.slice(1).toLowerCase()}`;
                const message = isApproved
                    ? 'Your attendance selfie evidence was approved. The day is now VERIFIED.'
                    : `Your attendance selfie evidence was ${status.toLowerCase()}${remarks ? ` ("${remarks}")` : ''}.`;
                await this.notificationsService.create({
                    userId: employeeUserId,
                    companyId,
                    title,
                    message,
                    type: isApproved ? 'SUCCESS' : 'ERROR',
                    link: '/dashboard/attendance',
                });
            }
            const hrUsers = await this.prisma.user.findMany({
                where: {
                    companyId,
                    role: { in: ['OWNER', 'HR_MANAGER'] },
                    deletedAt: null,
                },
                select: { id: true },
            });
            for (const user of hrUsers) {
                if (user.id === reviewerId)
                    continue;
                await this.notificationsService.create({
                    userId: user.id,
                    companyId,
                    title: 'Attendance Evidence Reviewed',
                    message: `An attendance evidence item was ${status.toLowerCase()}.${remarks ? ` Remarks: "${remarks}"` : ''}`,
                    type: status === 'APPROVED' ? 'SUCCESS' : 'WARNING',
                    link: '/dashboard/attendance?tab=evidence-queue',
                });
            }
        });
    }
};
exports.AttendanceEvidenceReviewListener = AttendanceEvidenceReviewListener;
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.ATTENDANCE_EVIDENCE_PENDING),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AttendanceEvidenceReviewListener.prototype, "handleEvidencePending", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.ATTENDANCE_EVIDENCE_REVIEWED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AttendanceEvidenceReviewListener.prototype, "handleEvidenceReviewed", null);
exports.AttendanceEvidenceReviewListener = AttendanceEvidenceReviewListener = AttendanceEvidenceReviewListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [governance_event_processor_1.GovernanceEventProcessor,
        prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], AttendanceEvidenceReviewListener);
//# sourceMappingURL=attendance-evidence-review.listener.js.map