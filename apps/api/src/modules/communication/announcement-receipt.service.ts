import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { GovernanceEventPublisher } from '../governance-events/governance-event.publisher';
import { DomainEventTypes } from '../governance-events/types/events';
import { AuditService } from '../audit/audit.service';

export interface MarkReadInput {
  companyId: string;
  announcementId: string;
  userId: string;
}

export interface AcknowledgeInput {
  companyId: string;
  announcementId: string;
  userId: string;
}

@Injectable()
export class AnnouncementReceiptService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: GovernanceEventPublisher,
    private readonly auditService: AuditService,
  ) {}

  async markRead(input: MarkReadInput): Promise<void> {
    const { companyId, announcementId, userId } = input;

    const announcement = await this.prisma.announcement.findFirst({
      where: { id: announcementId, companyId },
    });
    if (!announcement) {
      throw new NotFoundException(
        `Announcement with ID ${announcementId} not found`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.announcementReceipt.findUnique({
        where: { announcementId_userId: { announcementId, userId } },
      });

      if (existing) {
        if (!existing.readAt) {
          await tx.announcementReceipt.update({
            where: { id: existing.id },
            data: { readAt: new Date() },
          });
        }
      } else {
        await tx.announcementReceipt.create({
          data: {
            companyId,
            announcementId,
            userId,
            readAt: new Date(),
          },
        });
      }

      await this.eventPublisher.publish(tx, {
        eventType: DomainEventTypes.ANNOUNCEMENT_READ,
        entityId: announcementId,
        entityType: 'Announcement',
        companyId,
        payload: {
          companyId,
          announcementId,
          userId,
          readAt: new Date(),
        },
      });
    });
  }

  async acknowledge(input: AcknowledgeInput): Promise<void> {
    const { companyId, announcementId, userId } = input;

    const announcement = await this.prisma.announcement.findFirst({
      where: { id: announcementId, companyId },
    });
    if (!announcement) {
      throw new NotFoundException(
        `Announcement with ID ${announcementId} not found`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.announcementReceipt.findUnique({
        where: { announcementId_userId: { announcementId, userId } },
      });

      if (existing) {
        await tx.announcementReceipt.update({
          where: { id: existing.id },
          data: {
            readAt: existing.readAt ?? new Date(),
            acknowledgedAt: new Date(),
          },
        });
      } else {
        await tx.announcementReceipt.create({
          data: {
            companyId,
            announcementId,
            userId,
            readAt: new Date(),
            acknowledgedAt: new Date(),
          },
        });
      }

      await this.eventPublisher.publish(tx, {
        eventType: DomainEventTypes.ANNOUNCEMENT_ACKNOWLEDGED,
        entityId: announcementId,
        entityType: 'Announcement',
        companyId,
        payload: {
          companyId,
          announcementId,
          userId,
          acknowledgedAt: new Date(),
        },
      });
    });
  }

  async getReceipts(announcementId: string, companyId: string) {
    return this.prisma.announcementReceipt.findMany({
      where: { announcementId, companyId },
      include: {
        users: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async getReceiptCounts(announcementId: string, companyId: string) {
    const [total, readCount, acknowledgedCount] = await Promise.all([
      this.prisma.announcementReceipt.count({
        where: { announcementId, companyId },
      }),
      this.prisma.announcementReceipt.count({
        where: { announcementId, companyId, readAt: { not: null } },
      }),
      this.prisma.announcementReceipt.count({
        where: { announcementId, companyId, acknowledgedAt: { not: null } },
      }),
    ]);

    return { total, readCount, acknowledgedCount };
  }
}
