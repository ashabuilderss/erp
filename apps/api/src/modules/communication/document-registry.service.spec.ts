import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DocumentRegistryService } from './document-registry.service';

describe('DocumentRegistryService', () => {
  const companyId = 'comp-1';
  const userId = 'usr-1';

  const mockPrisma = () => ({
    documentRegistry: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    storageObject: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  });

  const mockEventPublisher = () => ({
    publish: jest.fn(),
  });

  const mockAuditService = () => ({
    record: jest.fn(),
  });

  const buildService = (overrides?: {
    prisma?: ReturnType<typeof mockPrisma>;
    eventPublisher?: ReturnType<typeof mockEventPublisher>;
    auditService?: ReturnType<typeof mockAuditService>;
  }) => {
    const prisma = overrides?.prisma ?? mockPrisma();
    const eventPublisher = overrides?.eventPublisher ?? mockEventPublisher();
    const auditService = overrides?.auditService ?? mockAuditService();
    const service = new DocumentRegistryService(
      prisma as never,
      eventPublisher as never,
      auditService,
    );
    return { service, prisma, eventPublisher, auditService };
  };

  describe('register', () => {
    it('throws NotFoundException when StorageObject not found', async () => {
      const { service, prisma } = buildService();
      prisma.storageObject.findFirst.mockResolvedValue(null);

      await expect(
        service.register({
          companyId,
          name: 'doc.pdf',
          fileType: 'application/pdf',
          fileSize: 1024,
          storageObjectId: 'so-1',
          uploadedById: userId,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('creates DocumentRegistry and publishes DOCUMENT_UPLOADED event', async () => {
      const { service, prisma, eventPublisher, auditService } = buildService();
      prisma.storageObject.findFirst.mockResolvedValue({
        id: 'so-1',
        companyId,
      });
      prisma.$transaction.mockImplementation(async (fn: Function) => {
        const tx = {
          documentRegistry: {
            create: jest.fn().mockResolvedValue({ id: 'doc-1' }),
          },
        };
        return fn(tx);
      });

      const result = await service.register({
        companyId,
        name: 'doc.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        storageObjectId: 'so-1',
        uploadedById: userId,
      });

      expect(result).toBe('doc-1');
      expect(eventPublisher.publish).toHaveBeenCalled();
      expect(auditService.record).toHaveBeenCalled();
    });

    it('defaults category to GENERAL and accessLevel to COMPANY', async () => {
      const { service, prisma } = buildService();
      prisma.storageObject.findFirst.mockResolvedValue({
        id: 'so-1',
        companyId,
      });
      const mockTxDocCreate = jest.fn().mockResolvedValue({ id: 'doc-1' });
      prisma.$transaction.mockImplementation(async (fn: Function) => {
        const tx = {
          documentRegistry: { create: mockTxDocCreate },
        };
        return fn(tx);
      });

      await service.register({
        companyId,
        name: 'doc.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        storageObjectId: 'so-1',
        uploadedById: userId,
      });

      expect(mockTxDocCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            category: 'GENERAL',
            accessLevel: 'COMPANY',
            status: 'ACTIVE',
          }),
        }),
      );
    });
  });

  describe('delete', () => {
    it('throws NotFoundException when document not found', async () => {
      const { service, prisma } = buildService();
      prisma.documentRegistry.findFirst.mockResolvedValue(null);

      await expect(
        service.delete({
          companyId,
          documentId: 'doc-1',
          userId,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException when already deleted', async () => {
      const { service, prisma } = buildService();
      prisma.documentRegistry.findFirst.mockResolvedValue({
        id: 'doc-1',
        companyId,
        status: 'DELETED',
      });

      await expect(
        service.delete({
          companyId,
          documentId: 'doc-1',
          userId,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('sets status to DELETED and publishes DOCUMENT_DELETED event', async () => {
      const { service, prisma, eventPublisher } = buildService();
      prisma.documentRegistry.findFirst.mockResolvedValue({
        id: 'doc-1',
        companyId,
        status: 'ACTIVE',
        name: 'doc.pdf',
      });
      const mockTxDocRegistry = { update: jest.fn() };
      prisma.$transaction.mockImplementation(async (fn: Function) =>
        fn({ documentRegistry: mockTxDocRegistry }),
      );

      await service.delete({
        companyId,
        documentId: 'doc-1',
        userId,
      });

      expect(mockTxDocRegistry.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'DELETED' }),
        }),
      );
      expect(eventPublisher.publish).toHaveBeenCalled();
    });
  });

  describe('getDocument', () => {
    it('throws NotFoundException when not found', async () => {
      const { service, prisma } = buildService();
      prisma.documentRegistry.findFirst.mockResolvedValue(null);

      await expect(
        service.getDocument('doc-1', companyId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns document with storage object and user info', async () => {
      const { service, prisma } = buildService();
      const mockDoc = { id: 'doc-1', companyId, name: 'doc.pdf' };
      prisma.documentRegistry.findFirst.mockResolvedValue(mockDoc);

      const result = await service.getDocument('doc-1', companyId);
      expect(result).toEqual(mockDoc);
    });
  });

  describe('listDocuments', () => {
    it('returns paginated results with meta', async () => {
      const { service, prisma } = buildService();
      prisma.documentRegistry.findMany.mockResolvedValue([]);
      prisma.documentRegistry.count.mockResolvedValue(0);

      const result = await service.listDocuments(companyId, {});
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.meta).toEqual(expect.objectContaining({ total: 0 }));
    });

    it('filters out DELETED documents by default', async () => {
      const { service, prisma } = buildService();
      prisma.documentRegistry.findMany.mockResolvedValue([]);
      prisma.documentRegistry.count.mockResolvedValue(0);

      await service.listDocuments(companyId, {});

      expect(prisma.documentRegistry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: { not: 'DELETED' } }),
        }),
      );
    });
  });
});
