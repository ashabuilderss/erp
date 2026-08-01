import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { IssueWarningDto } from './dto/warnings.dto';
import {
  WarningSeverity,
  WarningCategory,
  ApprovalStatus,
} from '@prisma/client';
import { GovernanceEventPublisher } from '../governance-events/governance-event.publisher';
import { DomainEventTypes } from '../governance-events/types/events';
import { ApprovalsSpawningService } from '../approvals';

@Injectable()
export class WarningsService {
  private readonly logger = new Logger(WarningsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly spawningService: ApprovalsSpawningService,
    private readonly eventPublisher: GovernanceEventPublisher,
  ) {}

  async issueWarning(
    companyId: string,
    issuerUserId: string,
    dto: IssueWarningDto,
  ) {
    const issuer = await this.prisma.employee.findFirst({
      where: { userId: issuerUserId, companyId },
    });
    if (!issuer && !dto.isSystemGenerated) {
      throw new BadRequestException('Issuer not found.');
    }

    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, companyId },
    });
    if (!employee) throw new BadRequestException('Employee not found.');

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    const settings = (company?.settings as any) || {};

    let expirationMonths = 6;
    if (dto.severity === WarningSeverity.LEVEL_1_VERBAL) {
      expirationMonths = settings.warningLevel1ExpiryMonths || 3;
    } else if (dto.severity === WarningSeverity.LEVEL_2_WRITTEN) {
      expirationMonths = settings.warningLevel2ExpiryMonths || 6;
    } else if (dto.severity === WarningSeverity.LEVEL_3_FINAL) {
      expirationMonths = settings.warningLevel3ExpiryMonths || 12;
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + expirationMonths);

    return await this.prisma.$transaction(async (tx) => {
      // Create warning
      const status =
        dto.severity === WarningSeverity.LEVEL_1_VERBAL
          ? ApprovalStatus.APPROVED
          : ApprovalStatus.PENDING;

      const warning = await tx.warning.create({
        data: {
          companyId,
          employeeId: employee.id,
          issuerId: dto.isSystemGenerated ? null : issuer?.id,
          category: dto.category,
          severity: dto.severity,
          reason: dto.reason,
          isSystemGenerated: dto.isSystemGenerated || false,
          status,
          expiresAt,
        },
      });

      await tx.warningHistory.create({
        data: {
          warningId: warning.id,
          companyId,
          actorId: issuer?.id,
          event: 'WARNING_ISSUED',
          comments: `Warning created. Severity: ${dto.severity}, Category: ${dto.category}.`,
        },
      });

      // Spawn Approval Request if LEVEL_2 or LEVEL_3
      if (dto.severity !== WarningSeverity.LEVEL_1_VERBAL) {
        const approvalReq = await this.spawningService.spawnRequest(
          companyId,
          'WARNING_APPROVAL',
          warning.id,
          issuerUserId, // Must be a User ID (not Employee ID) — FK references users.id
        );

        await tx.warning.update({
          where: { id: warning.id },
          data: { approvalId: approvalReq.id },
        });
      }

      // Check Category-Aware Accumulation Logic
      await this.evaluateAccumulationLogic(
        tx,
        companyId,
        employee.id,
        dto.category,
        warning.id,
        issuerUserId,
      );

      return warning;
    });
  }

  private async evaluateAccumulationLogic(
    tx: any,
    companyId: string,
    employeeId: string,
    category: WarningCategory,
    currentWarningId: string,
    issuerUserId: string,
  ) {
    const now = new Date();

    // Find active warnings in same category
    const activeWarnings = await tx.warning.findMany({
      where: {
        companyId,
        employeeId,
        category,
        expiresAt: { gt: now },
        status: { in: [ApprovalStatus.APPROVED, ApprovalStatus.PENDING] },
      },
    });

    const level1Count = activeWarnings.filter(
      (w: any) => w.severity === WarningSeverity.LEVEL_1_VERBAL,
    ).length;
    const level2Count = activeWarnings.filter(
      (w: any) => w.severity === WarningSeverity.LEVEL_2_WRITTEN,
    ).length;

    let triggerReview = false;
    let reviewReason = '';

    if (level1Count >= 3) {
      triggerReview = true;
      reviewReason = `Accumulated 3 Level 1 Warnings in category ${category}.`;
    } else if (level2Count >= 2) {
      triggerReview = true;
      reviewReason = `Accumulated 2 Level 2 Warnings in category ${category}.`;
    }

    if (triggerReview) {
      // Deduplication Check
      const existingReview = await tx.approvalRequest.findFirst({
        where: {
          companyId,
          entityType: 'DISCIPLINARY_REVIEW',
          entityId: employeeId,
          status: ApprovalStatus.PENDING,
        },
      });

      if (!existingReview) {
        // Trigger Disciplinary Review Request
        await tx.warningHistory.create({
          data: {
            warningId: currentWarningId,
            event: 'DISCIPLINARY_REVIEW_TRIGGERED',
            comments: reviewReason,
          },
        });

        // Spawn an HR Disciplinary Review Approval Request
        await this.spawningService.spawnRequest(
          companyId,
          'DISCIPLINARY_REVIEW',
          employeeId,
          issuerUserId, // Must be a User ID (not Employee ID) — FK references users.id
        );

        // Emit domain event for Payroll Hold mapping
        await this.eventPublisher.publish(tx, {
          eventType: DomainEventTypes.WARNING_THRESHOLD_BREACHED,
          entityId: employeeId,
          entityType: 'EMPLOYEE',
          companyId,
          payload: {
            companyId,
            employeeId,
            warningId: currentWarningId,
            reason: reviewReason,
          },
        });
      }
    }
  }

  async acknowledgeWarning(
    companyId: string,
    warningId: string,
    actorUserId: string,
  ) {
    const actor = await this.prisma.employee.findFirst({
      where: { userId: actorUserId, companyId },
    });

    return await this.prisma.$transaction(async (tx) => {
      const warning = await tx.warning.findFirst({
        where: { id: warningId, companyId },
      });

      if (!warning) throw new BadRequestException('Warning not found.');
      if (actor && warning.employeeId !== actor.id) {
        throw new BadRequestException(
          'Only the recipient can acknowledge this warning.',
        );
      }
      if (warning.status !== ApprovalStatus.APPROVED) {
        throw new BadRequestException(
          'Warning must be APPROVED before acknowledgment.',
        );
      }
      if (warning.acknowledgedAt) {
        throw new BadRequestException('Warning already acknowledged.');
      }

      const updated = await tx.warning.update({
        where: { id: warning.id },
        data: { acknowledgedAt: new Date() },
      });

      await tx.warningHistory.create({
        data: {
          warningId: warning.id,
          companyId: warning.companyId,
          actorId: actor?.id,
          event: 'WARNING_ACKNOWLEDGED',
          comments: 'Warning acknowledged by employee.',
        },
      });

      return updated;
    });
  }

  async findAll(companyId: string, query: any) {
    const { page = 1, limit = 10, employeeId, severity, status } = query;
    const skip = (page - 1) * limit;

    const where = {
      companyId,
      ...(employeeId ? { employeeId } : {}),
      ...(severity ? { severity } : {}),
      ...(status ? { status } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.warning.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          employeesWarningsEmployeeIdToemployees: { include: { users: true } },
          employeesWarningsIssuerIdToemployees: { include: { users: true } },
        },
      }),
      this.prisma.warning.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async findMyWarnings(companyId: string, userId: string, query: any) {
    const employee = await this.prisma.employee.findFirst({
      where: { userId, companyId },
    });

    if (!employee) {
      throw new BadRequestException('Employee profile not found.');
    }

    query.employeeId = employee.id;
    // By default, employees should only see their warnings that are APPROVED
    if (!query.status) {
      query.status = ApprovalStatus.APPROVED;
    }

    return this.findAll(companyId, query);
  }

  async findOne(companyId: string, id: string) {
    const warning = await this.prisma.warning.findFirst({
      where: { id, companyId },
      include: {
        employeesWarningsEmployeeIdToemployees: { include: { users: true } },
        employeesWarningsIssuerIdToemployees: { include: { users: true } },
        warningHistories: {
          orderBy: { createdAt: 'desc' },
          include: { employees: { include: { users: true } } },
        },
      },
    });

    if (!warning) throw new BadRequestException('Warning not found');
    return warning;
  }
}
