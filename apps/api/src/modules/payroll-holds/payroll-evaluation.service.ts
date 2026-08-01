import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { PayrollHoldStatus, PayrollHoldType } from '@prisma/client';

export interface PayrollHoldEvaluationResult {
  hasHold: boolean;
  salaryOverride?: number; // Sets salary to this (e.g. 0 for FULL_HOLD)
  salaryDeduction?: number; // Subtracts this amount
  incentivesBlocked: boolean;
  paymentDeferred: boolean;
}

@Injectable()
export class PayrollEvaluationService {
  private readonly logger = new Logger(PayrollEvaluationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async evaluateHold(employeeId: string): Promise<PayrollHoldEvaluationResult> {
    const activeHolds = await this.prisma.payrollHold.findMany({
      where: {
        employeeId,
        status: {
          in: [
            PayrollHoldStatus.ACTIVE_HOLD,
            PayrollHoldStatus.RELEASE_REQUESTED,
          ],
        },
      },
    });

    if (activeHolds.length === 0) {
      return {
        hasHold: false,
        incentivesBlocked: false,
        paymentDeferred: false,
      };
    }

    const types = activeHolds.map((h) => h.holdType);

    // Priority 1
    if (types.includes(PayrollHoldType.FULL_HOLD)) {
      return {
        hasHold: true,
        salaryOverride: 0,
        incentivesBlocked: true,
        paymentDeferred: false,
      };
    }

    // Priority 2
    if (types.includes(PayrollHoldType.DEFERRED_PAYMENT)) {
      return {
        hasHold: true,
        incentivesBlocked: false,
        paymentDeferred: true,
      };
    }

    // Priority 3 & 4
    let salaryDeduction = 0;
    let incentivesBlocked = false;

    for (const hold of activeHolds) {
      if (hold.holdType === PayrollHoldType.PARTIAL_HOLD && hold.amount) {
        salaryDeduction += Number(hold.amount);
      }
      if (hold.holdType === PayrollHoldType.INCENTIVE_HOLD) {
        incentivesBlocked = true;
      }
    }

    return {
      hasHold: true,
      salaryDeduction: salaryDeduction > 0 ? salaryDeduction : undefined,
      incentivesBlocked,
      paymentDeferred: false,
    };
  }

  // Helper method meant to be mapped over by the Payroll Generator
  async safeEvaluateHold(
    employeeId: string,
  ): Promise<PayrollHoldEvaluationResult> {
    try {
      return await this.evaluateHold(employeeId);
    } catch (error) {
      this.logger.error(
        `Failed to evaluate holds for employee ${employeeId}. Error isolated.`,
        error,
      );
      // Failsafe: Do not block company payroll. Treat as no hold, or strict hold depending on risk profile.
      // Assuming treating as no hold ensures the system continues
      return {
        hasHold: false,
        incentivesBlocked: false,
        paymentDeferred: false,
      };
    }
  }
}
