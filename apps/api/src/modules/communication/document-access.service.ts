import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { GovernanceEventPublisher } from '../governance-events/governance-event.publisher';
import { DomainEventTypes } from '../governance-events/types/events';
import { DocumentAccessLogService } from '../audit/document-access-log.service';

export interface LogAccessInput {
  companyId: string;
  documentId: string;
  userId: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class DocumentAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: GovernanceEventPublisher,
    private readonly accessLogService: DocumentAccessLogService,
  ) {}

  async logAccess(input: LogAccessInput): Promise<string> {
    const { companyId, documentId, userId, action, ipAddress, userAgent } =
      input;

    const document = await this.prisma.documentRegistry.findFirst({
      where: { id: documentId, companyId },
    });
    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    const accessLogId = await this.prisma.$transaction(async (tx) => {
      await this.accessLogService.log({
        tx,
        companyId,
        documentId,
        userId,
        action,
        ipAddress,
        userAgent,
      });

      await this.eventPublisher.publish(tx, {
        eventType: DomainEventTypes.DOCUMENT_ACCESSED,
        entityId: documentId,
        entityType: 'DocumentRegistry',
        companyId,
        payload: {
          companyId,
          documentId,
          userId,
          action,
        },
      });

      return `access-${documentId}-${userId}-${Date.now()}`;
    });

    return accessLogId;
  }

  async getAccessLogs(
    documentId: string,
    companyId: string,
    options: { page?: number; limit?: number },
  ) {
    const { page = 1, limit = 20 } = options;

    const where: Prisma.DocumentAccessLogWhereInput = { documentId, companyId };

    const [data, total] = await Promise.all([
      this.prisma.documentAccessLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          users: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      this.prisma.documentAccessLog.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getAccessStats(documentId: string, companyId: string) {
    const [totalAccesses, uniqueUsers] = await Promise.all([
      this.prisma.documentAccessLog.count({
        where: { documentId, companyId },
      }),
      this.prisma.documentAccessLog.groupBy({
        by: ['userId'],
        where: { documentId, companyId },
        _count: { userId: true },
      }),
    ]);

    return { totalAccesses, uniqueUserCount: uniqueUsers.length };
  }
}
