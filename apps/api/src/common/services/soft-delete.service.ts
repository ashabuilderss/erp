import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class SoftDeleteService {
  private readonly logger = new Logger(SoftDeleteService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Evaluates if a deletion is allowed and logs it to DeletionLog.
   * If allowed, the caller should then perform the actual soft delete.
   * Throws ForbiddenException if hard deletes are attempted or if governance blocks it.
   */
  async enforceDeletionGovernance(
    companyId: string,
    entityType: string,
    entityId: string,
    deletedById: string,
    reason: string,
    userRole: string,
  ) {
    // Only OWNER or ADMIN can delete critical operational records
    const criticalEntities = [
      'EMPLOYEE',
      'TASK',
      'WARNING',
      'PAYROLL_HOLD',
      'PROPERTY',
    ];

    if (criticalEntities.includes(entityType.toUpperCase())) {
      if (userRole !== 'OWNER' && userRole !== 'ADMIN') {
        throw new ForbiddenException(
          `Role ${userRole} is not authorized to delete ${entityType} records.`,
        );
      }
    }

    // Write audit log
    await this.prisma.deletionLog.create({
      data: {
        companyId,
        entityId,
        entityType: entityType.toUpperCase(),
        userId: deletedById,
        reason,
      },
    });

    this.logger.log(
      `Deletion Governance: ${entityType} ${entityId} approved for deletion by ${deletedById}`,
    );
  }
}
