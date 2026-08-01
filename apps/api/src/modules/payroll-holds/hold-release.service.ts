import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { TransitionService } from '../../common/services/transition.service';
import { PayrollHoldStatus, ApprovalStatus } from '@prisma/client';
import { ApprovalsSpawningService } from '../approvals';
import { ReleaseHoldDto } from './dto/payroll-holds.dto';

@Injectable()
export class HoldReleaseService {
  private readonly logger = new Logger(HoldReleaseService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly spawningService: ApprovalsSpawningService,
    private readonly transitionService: TransitionService,
  ) {}

  async requestRelease(
    companyId: string,
    holdId: string,
    actorUserId: string,
    dto: ReleaseHoldDto,
  ) {
    const actor = await this.prisma.employee.findFirst({
      where: { userId: actorUserId, companyId },
    });
    if (!actor) throw new BadRequestException('Actor employee not found.');

    const hold = await this.prisma.payrollHold.findFirst({
      where: { id: holdId, companyId },
    });
    if (!hold) throw new BadRequestException('Hold not found.');

    if (hold.status === PayrollHoldStatus.RELEASE_REQUESTED) {
      throw new ConflictException(
        'A release request is already pending for this hold.',
      );
    }
    if (hold.status !== PayrollHoldStatus.ACTIVE_HOLD) {
      throw new BadRequestException('Only an ACTIVE_HOLD can be released.');
    }

    this.transitionService.validate(
      'PayrollHold',
      hold.status,
      PayrollHoldStatus.RELEASE_REQUESTED,
    );

    return await this.prisma.$transaction(async (tx) => {
      // Optimistic Locking transition to RELEASE_REQUESTED
      const updateResult = await tx.payrollHold.updateMany({
        where: {
          id: hold.id,
          status: PayrollHoldStatus.ACTIVE_HOLD,
        },
        data: {
          status: PayrollHoldStatus.RELEASE_REQUESTED,
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictException(
          'Hold state changed concurrently. Request aborted.',
        );
      }

      await tx.payrollHoldHistory.create({
        data: {
          holdId: hold.id,
          companyId: hold.companyId,
          event: 'HOLD_RELEASE_REQUESTED',
          actorId: actor.id,
          comments: `Release requested. Reason: ${dto.reason}`,
        },
      });

      // Spawn Approval Request — pass User ID for proper manager resolution
      const approvalReq = await this.spawningService.spawnRequest(
        companyId,
        'PAYROLL_RELEASE',
        hold.id,
        actorUserId, // User ID, not Employee ID
      );

      // We need another reference or update to approvalId?
      // The original `approvalId` points to the Hold Activation approval.
      // We should ideally have a separate field, or just rely on the ApprovalEngine pointing to `entityId = hold.id`
      // For simplicity, we can overwrite approvalId or leave it decoupled.
      await tx.payrollHold.update({
        where: { id: hold.id },
        data: { approvalId: approvalReq.id },
      });

      return { status: 'RELEASE_REQUESTED' };
    });
  }

  // Triggered by Generic Approval Engine when workflow concludes
  async processReleaseOutcome(approvalId: string, status: ApprovalStatus) {
    const hold = await this.prisma.payrollHold.findUnique({
      where: { approvalId },
    });

    if (!hold || hold.status !== PayrollHoldStatus.RELEASE_REQUESTED) return;

    if (status === ApprovalStatus.APPROVED) {
      this.transitionService.validate(
        'PayrollHold',
        hold.status,
        PayrollHoldStatus.RELEASED,
      );
      const result = await this.prisma.payrollHold.updateMany({
        where: { id: hold.id, status: PayrollHoldStatus.RELEASE_REQUESTED },
        data: { status: PayrollHoldStatus.RELEASED },
      });

      if (result.count > 0) {
        await this.prisma.payrollHoldHistory.create({
          data: {
            holdId: hold.id,
            companyId: hold.companyId,
            event: 'HOLD_RELEASED',
            comments: 'Payroll Hold Release APPROVED.',
          },
        });
      }
    } else if (status === ApprovalStatus.REJECTED) {
      this.transitionService.validate(
        'PayrollHold',
        hold.status,
        PayrollHoldStatus.ACTIVE_HOLD,
      );
      const result = await this.prisma.payrollHold.updateMany({
        where: { id: hold.id, status: PayrollHoldStatus.RELEASE_REQUESTED },
        data: { status: PayrollHoldStatus.ACTIVE_HOLD }, // Revert to active
      });

      if (result.count > 0) {
        await this.prisma.payrollHoldHistory.create({
          data: {
            holdId: hold.id,
            companyId: hold.companyId,
            event: 'HOLD_RELEASE_REJECTED',
            comments: 'Payroll Hold Release REJECTED.',
          },
        });
      }
    }
  }
}
