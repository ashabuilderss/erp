import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import {
  ApprovalStatus,
  PayrollHoldStatus,
  PayrollHoldSource,
  UserRole,
} from '@prisma/client';
import { CreateEmergencyHoldDto } from './dto/payroll-holds.dto';

@Injectable()
export class HoldActivationListener {
  private readonly logger = new Logger(HoldActivationListener.name);

  constructor(private readonly prisma: PrismaService) {}

  // Triggered by Generic Approval Engine when workflow concludes
  async processActivationOutcome(approvalId: string, status: ApprovalStatus) {
    const hold = await this.prisma.payrollHold.findUnique({
      where: { approvalId },
    });

    if (!hold || hold.status !== PayrollHoldStatus.REQUESTED) return;

    if (status === ApprovalStatus.APPROVED) {
      // Optimistic Locking: Attempt to update only if status is REQUESTED
      const result = await this.prisma.payrollHold.updateMany({
        where: {
          id: hold.id,
          status: PayrollHoldStatus.REQUESTED,
        },
        data: {
          status: PayrollHoldStatus.ACTIVE_HOLD,
        },
      });

      if (result.count === 0) {
        this.logger.warn(
          `Hold ${hold.id} activation aborted: Optimistic lock failed or already transitioned.`,
        );
        return;
      }

      await this.prisma.payrollHoldHistory.create({
        data: {
          holdId: hold.id,
          companyId: hold.companyId,
          event: 'HOLD_ACTIVATED',
          comments: `Payroll Hold APPROVED and ACTIVATED.`,
        },
      });
    } else if (status === ApprovalStatus.REJECTED) {
      const result = await this.prisma.payrollHold.updateMany({
        where: {
          id: hold.id,
          status: PayrollHoldStatus.REQUESTED,
        },
        data: {
          status: PayrollHoldStatus.REJECTED,
        },
      });

      if (result.count > 0) {
        await this.prisma.payrollHoldHistory.create({
          data: {
            holdId: hold.id,
            companyId: hold.companyId,
            event: 'HOLD_REJECTED',
            comments: `Payroll Hold REJECTED.`,
          },
        });
      }
    }
  }

  // Owner Bypass
  async createEmergencyHold(
    companyId: string,
    ownerUserId: string,
    dto: CreateEmergencyHoldDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: ownerUserId },
    });
    if (!user || user.role !== UserRole.OWNER) {
      throw new ForbiddenException('Only owners can activate emergency holds.');
    }

    const owner = await this.prisma.employee.findFirst({
      where: { userId: ownerUserId, companyId },
    });
    if (!owner)
      throw new BadRequestException('Owner employee profile not found.');

    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, companyId },
    });
    if (!employee) throw new BadRequestException('Employee not found.');

    return await this.prisma.$transaction(async (tx) => {
      const hold = await tx.payrollHold.create({
        data: {
          companyId,
          employeeId: employee.id,
          source: PayrollHoldSource.OWNER_MANUAL,
          holdType: dto.holdType,
          amount: dto.amount,
          reason: dto.reason,
          createdById: owner.id,
          status: PayrollHoldStatus.ACTIVE_HOLD, // Instantly Active
        },
      });

      await tx.payrollHoldHistory.create({
        data: {
          holdId: hold.id,
          companyId,
          event: 'OWNER_EMERGENCY_HOLD',
          actorId: owner.id,
          comments: `Emergency hold activated directly by Owner. Reason: ${dto.reason}`,
        },
      });

      return hold;
    });
  }
}
