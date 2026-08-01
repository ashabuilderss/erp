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
export class ApprovalsSpawningService {
  private readonly logger = new Logger(ApprovalsSpawningService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: GovernanceEventPublisher,
  ) {}

  async spawnRequest(
    companyId: string,
    entityType: string,
    entityId: string,
    createdById: string,
  ) {
    // Look up active template
    const template = await this.prisma.approvalTemplate.findUnique({
      where: {
        companyId_entityType: {
          companyId,
          entityType,
        },
      },
      include: {
        approvalTemplateSteps: {
          orderBy: { sequence: 'asc' },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(
        `Approval template not found for entity type: ${entityType}`,
      );
    }

    if (template.approvalTemplateSteps.length === 0) {
      throw new BadRequestException(
        'Approval template has no steps configured.',
      );
    }

    // Resolve the employee record from the user ID for manager resolution
    const employee = await this.prisma.employee.findFirst({
      where: { userId: createdById, companyId },
    });

    let defaultOwnerUserId: string | null = null;
    const fetchOwner = async () => {
      if (defaultOwnerUserId) return defaultOwnerUserId;
      const ownerUser = await this.prisma.user.findFirst({
        where: { companyId, role: 'OWNER' },
      });
      defaultOwnerUserId = ownerUser?.id || createdById; // Fallback to creator if no owner found somehow
      return defaultOwnerUserId;
    };

    return await this.prisma.$transaction(async (tx) => {
      // 1. Create the parent request
      const request = await tx.approvalRequest.create({
        data: {
          companyId,
          entityType,
          entityId,
          createdById,
          status: ApprovalStatus.PENDING,
        },
      });

      // 2. Map and create steps
      let managerFallbackAudits = 0;

      for (const tStep of template.approvalTemplateSteps) {
        let finalUserId = tStep.requiredUserId;
        const finalRoleId = tStep.requiredRoleId;

        let escalationLvl = 0;

        if (tStep.isDirectManager) {
          if (employee && employee.managerId) {
            // Find the user ID of the manager
            const manager = await tx.employee.findUnique({
              where: { id: employee.managerId },
            });
            if (manager && manager.userId) {
              finalUserId = manager.userId;
            } else {
              // Fallback
              finalUserId = await fetchOwner();
              escalationLvl = 1;
              managerFallbackAudits++;
            }
          } else {
            // Fallback
            finalUserId = await fetchOwner();
            escalationLvl = 1;
            managerFallbackAudits++;
          }
        }

        const now = new Date();
        const deadline = new Date(
          now.getTime() + tStep.slaHours * 60 * 60 * 1000,
        );

        const step = await tx.approvalStep.create({
          data: {
            companyId,
            requestId: request.id,
            sequence: tStep.sequence,
            requiredRoleId: finalRoleId,
            requiredUserId: finalUserId,
            isDirectManager: tStep.isDirectManager,
            status: ApprovalStatus.PENDING,
            slaDeadline: deadline,
            escalationLevel: escalationLvl,
          },
        });

        // Audit fallback if it happened on this step
        if (escalationLvl > 0 && tStep.isDirectManager) {
          await tx.approvalHistory.create({
            data: {
              companyId,
              requestId: request.id,
              stepId: step.id,
              action: 'MANAGER_FALLBACK_TO_OWNER',
              comments: 'No direct manager found. Forcibly routed to Owner.',
            },
          });
        }
      }

      await tx.approvalHistory.create({
        data: {
          companyId,
          requestId: request.id,
          action: 'REQUEST_SPAWNED',
          comments: `Workflow dynamically spawned from template ${template.id}`,
        },
      });

      await this.eventPublisher.publish(tx, {
        correlationId: request.id,
        eventType: DomainEventTypes.APPROVAL_CREATED,
        entityId: request.entityId,
        entityType: request.entityType,
        companyId: request.companyId,
        payload: {
          companyId: request.companyId,
          requestId: request.id,
          entityType: request.entityType,
          entityId: request.entityId,
          createdById,
        },
      });

      return request;
    });
  }
}
