import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { RecommendHoldDto } from './dto/payroll-holds.dto';
import { PayrollHoldStatus, PayrollHoldType } from '@prisma/client';
import { ApprovalsSpawningService } from '../approvals';

@Injectable()
export class HoldRecommendationService {
  private readonly logger = new Logger(HoldRecommendationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly spawningService: ApprovalsSpawningService,
  ) {}

  async createRecommendation(
    companyId: string,
    createdByUserId: string | null,
    dto: RecommendHoldDto,
  ) {
    // 1. Source Validation & Creator Resolution
    let creatorEmployeeId = null;
    let creatorUserId: string | null = createdByUserId;
    if (createdByUserId) {
      const creator = await this.prisma.employee.findFirst({
        where: { userId: createdByUserId, companyId },
      });
      if (creator) {
        creatorEmployeeId = creator.id;
        creatorUserId = createdByUserId;
      }
    }

    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, companyId },
    });
    if (!employee) throw new BadRequestException('Employee not found.');

    if (dto.source === 'TASK_ENGINE' && !dto.sourceId)
      throw new BadRequestException('Task ID required for TASK_ENGINE source.');
    if (dto.source === 'WARNING_ENGINE' && !dto.sourceId)
      throw new BadRequestException(
        'Warning ID required for WARNING_ENGINE source.',
      );

    // Enforce Payload Validity
    if (dto.holdType === PayrollHoldType.PARTIAL_HOLD && !dto.amount) {
      throw new BadRequestException('Amount is required for PARTIAL_HOLD.');
    }

    return await this.prisma.$transaction(async (tx) => {
      // 2. Recommendation Deduplication
      const existingHold = await tx.payrollHold.findFirst({
        where: {
          companyId,
          employeeId: employee.id,
          source: dto.source,
          sourceId: dto.sourceId,
          status: {
            in: [
              PayrollHoldStatus.REQUESTED,
              PayrollHoldStatus.UNDER_REVIEW,
              PayrollHoldStatus.ACTIVE_HOLD,
              PayrollHoldStatus.RELEASE_REQUESTED,
            ],
          },
        },
      });

      if (existingHold) {
        this.logger.debug(
          `Deduplication triggered for hold source: ${dto.source}, sourceId: ${dto.sourceId}`,
        );
        return existingHold; // Graceful abort
      }

      // 3. Create Recommendation
      const hold = await tx.payrollHold.create({
        data: {
          companyId,
          employeeId: employee.id,
          source: dto.source,
          sourceId: dto.sourceId,
          holdType: dto.holdType,
          amount: dto.amount,
          reason: dto.reason,
          evidenceUri: dto.evidenceUri,
          createdById: creatorEmployeeId,
          status: PayrollHoldStatus.REQUESTED,
        },
      });

      await tx.payrollHoldHistory.create({
        data: {
          holdId: hold.id,
          companyId,
          event: 'HOLD_RECOMMENDED',
          actorId: creatorEmployeeId,
          comments: `Payroll Hold Recommended. Type: ${dto.holdType}, Source: ${dto.source}`,
        },
      });

      // 4. Spawn Approval Request — always pass a User ID for proper manager resolution
      const requesterUserId = creatorUserId || employee.userId;
      const approvalReq = await this.spawningService.spawnRequest(
        companyId,
        'PAYROLL_HOLD',
        hold.id,
        requesterUserId!,
      );

      await tx.payrollHold.update({
        where: { id: hold.id },
        data: { approvalId: approvalReq.id },
      });

      return hold;
    });
  }
}
