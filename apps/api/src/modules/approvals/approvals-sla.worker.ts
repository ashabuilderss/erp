import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../config/prisma.service';
import { ApprovalStatus } from '@prisma/client';

@Injectable()
export class ApprovalsSlaWorker {
  private readonly logger = new Logger(ApprovalsSlaWorker.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 */15 * * * *')
  async handleSlaBreaches() {
    this.logger.debug('Running SLA Breach Check for Approvals...');
    const now = new Date();

    const expiredSteps = await this.prisma.approvalStep.findMany({
      where: {
        status: ApprovalStatus.PENDING,
        slaDeadline: { lt: now },
      },
      include: {
        approvalRequests: true,
      },
    });

    if (expiredSteps.length === 0) return;

    for (const step of expiredSteps) {
      try {
        await this.prisma.$transaction(async (tx) => {
          // Double check status in transaction
          const currentStep = await tx.approvalStep.findUnique({
            where: { id: step.id },
          });
          if (!currentStep || currentStep.status !== ApprovalStatus.PENDING)
            return;

          const newEscalationLevel = currentStep.escalationLevel + 1;
          let reRoutedUserId: string | null = null;
          const auditAction = 'SLA_ESCALATED';
          let auditComments = `Step breached SLA. Escalation Level: ${newEscalationLevel}.`;

          if (newEscalationLevel === 1 && currentStep.requiredUserId) {
            // Level 1: Route to Delegate
            const requiredEmployee = await tx.employee.findFirst({
              where: { userId: currentStep.requiredUserId },
            });

            if (requiredEmployee) {
              const delegation = await tx.delegation.findFirst({
                where: {
                  delegatorId: requiredEmployee.id,
                  isActive: true,
                  validFrom: { lte: now },
                  validTo: { gte: now },
                },
                include: { employeesDelegationsDelegateIdToemployees: true },
              });

              if (
                delegation &&
                delegation.employeesDelegationsDelegateIdToemployees &&
                delegation.employeesDelegationsDelegateIdToemployees.userId
              ) {
                reRoutedUserId =
                  delegation.employeesDelegationsDelegateIdToemployees.userId;
                auditComments += ` Routed to Delegate: ${reRoutedUserId}.`;
              }
            }
          }

          // If Level > 1 or Level 1 but no active Delegate, route to Owner
          if (!reRoutedUserId) {
            const owner = await tx.user.findFirst({
              where: {
                companyId: step.approvalRequests.companyId,
                role: 'OWNER',
              },
            });
            if (owner) {
              reRoutedUserId = owner.id;
              auditComments += ` Routed directly to Company Owner.`;
            } else {
              // Failsafe
              auditComments += ` Failed to find Owner to route to.`;
            }
          }

          // Update Step with new routing & reset SLA deadline?
          // If we re-route, we must give them time to respond. Hardcoding 24h extension for the escalation tier for now.
          const extendedDeadline = new Date(
            now.getTime() + 24 * 60 * 60 * 1000,
          );

          await tx.approvalStep.update({
            where: { id: step.id },
            data: {
              escalationLevel: newEscalationLevel,
              requiredUserId: reRoutedUserId || currentStep.requiredUserId,
              slaDeadline: extendedDeadline,
              // Keep status PENDING so the new assignee can approve it
            },
          });

          // Mark the entire request as ESCALATED to warn the UI
          if (step.approvalRequests.status !== ApprovalStatus.ESCALATED) {
            await tx.approvalRequest.update({
              where: { id: step.requestId },
              data: { status: ApprovalStatus.ESCALATED },
            });
          }

          await tx.approvalHistory.create({
            data: {
              companyId: step.approvalRequests.companyId,
              requestId: step.requestId,
              stepId: step.id,
              action: auditAction,
              comments: auditComments,
            },
          });
        });
      } catch (err: any) {
        this.logger.error(
          `Failed to process SLA breach for step ${step.id}: ${err.message}`,
        );
      }
    }
  }
}
