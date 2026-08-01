import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { ApprovalStatus } from '@prisma/client';
import { GovernanceEventPublisher } from '../governance-events/governance-event.publisher';
import { DomainEventTypes } from '../governance-events/types/events';

@Injectable()
export class ApprovalsRuntimeService {
  private readonly logger = new Logger(ApprovalsRuntimeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: GovernanceEventPublisher,
  ) {}

  private async verifyDelegation(
    authorizerId: string,
    requiredUserId: string,
  ): Promise<boolean> {
    if (authorizerId === requiredUserId) return true;

    // Resolve authorizer employee
    const authorizerEmployee = await this.prisma.employee.findFirst({
      where: { userId: authorizerId },
    });
    const requiredEmployee = await this.prisma.employee.findFirst({
      where: { userId: requiredUserId },
    });

    if (!authorizerEmployee || !requiredEmployee) return false;

    // Check for active delegation from requiredUser -> authorizer
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

  async approveStep(requestId: string, userId: string, comments?: string) {
    return await this.prisma.$transaction(async (tx) => {
      // Optimistic lock check: find the active PENDING request
      const request = await tx.approvalRequest.findFirst({
        where: { id: requestId, status: ApprovalStatus.PENDING },
        include: { approvalSteps: { orderBy: { sequence: 'asc' } } },
      });

      if (!request) {
        throw new BadRequestException('Approval request is not pending.');
      }

      // Find the currently pending step (lowest sequence)
      const currentStep = request.approvalSteps.find(
        (s) => s.status === ApprovalStatus.PENDING,
      );
      if (!currentStep) {
        throw new BadRequestException(
          'No pending steps found for this request.',
        );
      }

      // Check Authorization
      // For now, we only enforce requiredUserId + Delegation. In a full system, requiredRoleId would also be checked via RbacService.
      if (currentStep.requiredUserId) {
        const isAuthorized = await this.verifyDelegation(
          userId,
          currentStep.requiredUserId,
        );
        if (!isAuthorized) {
          throw new BadRequestException(
            'User is not authorized to approve this step.',
          );
        }
      }

      // Update Step Status safely
      const updatedStep = await tx.approvalStep.updateMany({
        where: { id: currentStep.id, status: ApprovalStatus.PENDING },
        data: { status: ApprovalStatus.APPROVED },
      });

      if (updatedStep.count === 0) {
        throw new BadRequestException(
          'Concurrency error: step was already modified.',
        );
      }

      // Audit log
      await tx.approvalHistory.create({
        data: {
          companyId: request.companyId,
          requestId,
          stepId: currentStep.id,
          // Since actorId points to Employee, we need the actor's employee ID. Assuming a helper function, or we just leave actorId null and put userId in comments for now.
          action: 'APPROVED',
          comments: comments || `Approved by user ${userId}`,
        },
      });

      // Check if this was the last step
      const hasMoreSteps = request.approvalSteps.some(
        (s) => s.sequence > currentStep.sequence,
      );
      if (!hasMoreSteps) {
        await tx.approvalRequest.updateMany({
          where: { id: requestId, status: ApprovalStatus.PENDING },
          data: { status: ApprovalStatus.APPROVED },
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
          eventType: DomainEventTypes.APPROVAL_APPROVED,
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

  async rejectStep(requestId: string, userId: string, comments?: string) {
    return await this.prisma.$transaction(async (tx) => {
      const request = await tx.approvalRequest.findFirst({
        where: { id: requestId, status: ApprovalStatus.PENDING },
        include: { approvalSteps: { orderBy: { sequence: 'asc' } } },
      });

      if (!request) {
        throw new BadRequestException('Approval request is not pending.');
      }

      const currentStep = request.approvalSteps.find(
        (s) => s.status === ApprovalStatus.PENDING,
      );
      if (!currentStep) {
        throw new BadRequestException('No pending steps found.');
      }

      if (currentStep.requiredUserId) {
        const isAuthorized = await this.verifyDelegation(
          userId,
          currentStep.requiredUserId,
        );
        if (!isAuthorized) {
          throw new BadRequestException(
            'User is not authorized to reject this step.',
          );
        }
      }

      const updatedStep = await tx.approvalStep.updateMany({
        where: { id: currentStep.id, status: ApprovalStatus.PENDING },
        data: { status: ApprovalStatus.REJECTED },
      });

      if (updatedStep.count === 0) {
        throw new BadRequestException(
          'Concurrency error: step was already modified.',
        );
      }

      // Reject the entire request
      await tx.approvalRequest.update({
        where: { id: requestId },
        data: { status: ApprovalStatus.REJECTED },
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
        eventType: DomainEventTypes.APPROVAL_REJECTED,
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

  async overrideRequest(requestId: string, userId: string, reason: string) {
    if (!reason || reason.trim() === '') {
      throw new BadRequestException('Override requires a mandatory reason.');
    }

    return await this.prisma.$transaction(async (tx) => {
      const request = await tx.approvalRequest.findFirst({
        where: {
          id: requestId,
          status: { in: [ApprovalStatus.PENDING, ApprovalStatus.ESCALATED] },
        },
      });

      if (!request) {
        throw new BadRequestException(
          'Request is not in an overridable state.',
        );
      }

      // Mark request as APPROVED
      const updatedReq = await tx.approvalRequest.updateMany({
        where: { id: requestId, status: request.status },
        data: { status: ApprovalStatus.APPROVED },
      });

      if (updatedReq.count === 0) {
        throw new BadRequestException('Concurrency error on override.');
      }

      // Mark all pending steps as CANCELLED as part of override bypass
      await tx.approvalStep.updateMany({
        where: { requestId, status: ApprovalStatus.PENDING },
        data: { status: ApprovalStatus.CANCELLED },
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
        eventType: DomainEventTypes.APPROVAL_OVERRIDDEN,
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

  async escalateRequest(requestId: string) {
    return await this.prisma.$transaction(async (tx) => {
      const request = await tx.approvalRequest.findFirst({
        where: { id: requestId, status: ApprovalStatus.PENDING },
        include: { approvalSteps: { orderBy: { sequence: 'asc' } } },
      });

      if (!request) return;

      const currentStep = request.approvalSteps.find(
        (s) => s.status === ApprovalStatus.PENDING,
      );
      if (!currentStep) return;

      // Escalate Step Level (increment level, route to owner)
      await tx.approvalStep.update({
        where: { id: currentStep.id },
        data: { escalationLevel: currentStep.escalationLevel + 1 },
      });

      // Update Request status to ESCALATED
      await tx.approvalRequest.update({
        where: { id: requestId },
        data: { status: ApprovalStatus.ESCALATED },
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
}
