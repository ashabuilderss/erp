import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { TransitionService } from '../../common/services/transition.service';
import { ApprovalStatus } from '@prisma/client';

@Injectable()
export class WarningApprovalListener {
  private readonly logger = new Logger(WarningApprovalListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly transitionService: TransitionService,
  ) {}

  // This method would be called by the Approval Engine when a request is fully approved or rejected
  async processWarningApprovalOutcome(
    approvalId: string,
    status: ApprovalStatus,
  ) {
    const warning = await this.prisma.warning.findFirst({
      where: { approvalId, status: ApprovalStatus.PENDING },
    });

    if (!warning) return;

    // Validate FSM transition before updating status
    this.transitionService.validate('Warning', warning.status, status);

    await this.prisma.$transaction(async (tx) => {
      await tx.warning.update({
        where: { id: warning.id },
        data: { status },
      });

      await tx.warningHistory.create({
        data: {
          warningId: warning.id,
          companyId: warning.companyId,
          event:
            status === ApprovalStatus.APPROVED
              ? 'WARNING_APPROVED'
              : 'WARNING_REJECTED',
          comments: `Warning approval request was ${status.toLowerCase()} by management.`,
        },
      });
    });
  }
}
