import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { GovernanceEventPublisher } from '../governance-events/governance-event.publisher';
import { DomainEventTypes } from '../governance-events/types/events';
import { AuditService } from '../audit/audit.service';

export interface RegisterDocumentInput {
  companyId: string;
  name: string;
  fileType: string;
  fileSize: number;
  category?: string;
  storageObjectId: string;
  uploadedById: string;
  accessLevel?: string;
}

export interface DeleteDocumentInput {
  companyId: string;
  documentId: string;
  userId: string;
}

@Injectable()
export class DocumentRegistryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: GovernanceEventPublisher,
    private readonly auditService: AuditService,
  ) {}

  async register(input: RegisterDocumentInput): Promise<string> {
    const {
      companyId,
      name,
      fileType,
      fileSize,
      category,
      storageObjectId,
      uploadedById,
      accessLevel,
    } = input;

    const storageObject = await this.prisma.storageObject.findFirst({
      where: { id: storageObjectId, companyId },
    });
    if (!storageObject) {
      throw new NotFoundException(
        `StorageObject with ID ${storageObjectId} not found`,
      );
    }

    const documentId = await this.prisma.$transaction(async (tx) => {
      const document = await tx.documentRegistry.create({
        data: {
          companyId,
          name,
          fileType,
          fileSize,
          category: (category as any) ?? 'GENERAL',
          storageObjectId,
          uploadedById,
          accessLevel: accessLevel ?? 'COMPANY',
          status: 'ACTIVE',
        },
      });

      await this.eventPublisher.publish(tx, {
        eventType: DomainEventTypes.DOCUMENT_UPLOADED,
        entityId: document.id,
        entityType: 'DocumentRegistry',
        companyId,
        payload: {
          companyId,
          name,
          fileType,
          fileSize,
          category: category ?? 'GENERAL',
          accessLevel: accessLevel ?? 'COMPANY',
          uploadedById,
        },
      });

      await this.auditService.record({
        tx,
        companyId,
        entityType: 'DocumentRegistry',
        entityId: document.id,
        action: 'CREATED',
        userId: uploadedById,
        newState: { name, fileType, category, accessLevel },
      });

      return document.id;
    });

    return documentId;
  }

  async delete(input: DeleteDocumentInput): Promise<void> {
    const { companyId, documentId, userId } = input;

    const document = await this.prisma.documentRegistry.findFirst({
      where: { id: documentId, companyId },
    });
    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }
    if (document.status === 'DELETED') {
      throw new BadRequestException('Document is already deleted');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.documentRegistry.update({
        where: { id: documentId },
        data: { status: 'DELETED', deletedAt: new Date() },
      });

      await this.eventPublisher.publish(tx, {
        eventType: DomainEventTypes.DOCUMENT_DELETED,
        entityId: documentId,
        entityType: 'DocumentRegistry',
        companyId,
        payload: {
          companyId,
          name: document.name,
          deletedById: userId,
        },
      });

      await this.auditService.record({
        tx,
        companyId,
        entityType: 'DocumentRegistry',
        entityId: documentId,
        action: 'DELETED',
        userId,
        previousState: { status: 'ACTIVE' },
        newState: { status: 'DELETED' },
      });
    });
  }

  async getDocument(id: string, companyId: string) {
    const document = await this.prisma.documentRegistry.findFirst({
      where: { id, companyId },
      include: {
        storageObjects: {
          select: {
            id: true,
            bucketName: true,
            objectKey: true,
            checksum: true,
          },
        },
        users: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    return document;
  }

  async listDocuments(
    companyId: string,
    options: { page?: number; limit?: number; category?: string },
  ) {
    const { page = 1, limit = 10, category } = options;
    const where: Prisma.DocumentRegistryWhereInput = {
      companyId,
      status: { not: 'DELETED' },
    };
    if (category) where.category = category as any;

    const [data, total] = await Promise.all([
      this.prisma.documentRegistry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          storageObjects: {
            select: { id: true, bucketName: true, objectKey: true },
          },
          users: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.documentRegistry.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
