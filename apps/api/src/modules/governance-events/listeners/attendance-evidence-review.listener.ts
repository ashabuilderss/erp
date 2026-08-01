import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent } from '@prisma/client';
import { GovernanceEventProcessor } from '../governance-event.processor';
import { DomainEventTypes } from '../types/events';
import { PrismaService } from '../../../config/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class AttendanceEvidenceReviewListener {
  private readonly logger = new Logger(AttendanceEvidenceReviewListener.name);

  constructor(
    private readonly processor: GovernanceEventProcessor,
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @OnEvent(DomainEventTypes.ATTENDANCE_EVIDENCE_PENDING)
  async handleEvidencePending(event: DomainEvent) {
    await this.processor.process(
      event,
      'AttendanceEvidenceReviewListener_handleEvidencePending',
      async () => {
        const payload: any = event.payload;
        const evidence = await this.prisma.attendanceEvidence.findUnique({
          where: { id: event.entityId },
          select: { punchId: true, companyId: true },
        });
        if (!evidence) {
          this.logger.warn(`Evidence ${event.entityId} not found`);
          return;
        }

        const employeeId = evidence.punchId
          ? (
              await this.prisma.attendancePunch.findUnique({
                where: { id: evidence.punchId },
                select: { employeeId: true },
              })
            )?.employeeId
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
      },
    );
  }

  @OnEvent(DomainEventTypes.ATTENDANCE_EVIDENCE_REVIEWED)
  async handleEvidenceReviewed(event: DomainEvent) {
    await this.processor.process(
      event,
      'AttendanceEvidenceReviewListener_handleEvidenceReviewed',
      async () => {
        const payload: any = event.payload;
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

        let employeeUserId: string | null = null;
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
          if (user.id === reviewerId) continue;
          await this.notificationsService.create({
            userId: user.id,
            companyId,
            title: 'Attendance Evidence Reviewed',
            message: `An attendance evidence item was ${status.toLowerCase()}.${remarks ? ` Remarks: "${remarks}"` : ''}`,
            type: status === 'APPROVED' ? 'SUCCESS' : 'WARNING',
            link: '/dashboard/attendance?tab=evidence-queue',
          });
        }
      },
    );
  }
}
