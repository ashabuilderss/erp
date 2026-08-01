import { NotFoundException } from '@nestjs/common';
import { ConstructionService } from './construction.service';

describe('ConstructionService', () => {
  let service: ConstructionService;
  let mockPrisma: any;

  const companyId = 'company-1';

  beforeEach(() => {
    mockPrisma = {
      constructionSite: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn(), count: jest.fn() },
      sitePhase: { create: jest.fn(), update: jest.fn(), findFirst: jest.fn() },
      vendor: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn(), count: jest.fn() },
      material: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn(), deleteMany: jest.fn(), count: jest.fn() },
      materialInward: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn(), count: jest.fn() },
      inventoryItem: { findMany: jest.fn(), findFirst: jest.fn(), upsert: jest.fn() },
      labourEntry: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn(), count: jest.fn() },
      progressPhoto: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    };
    service = new ConstructionService(mockPrisma as never);
  });

  describe('Sites', () => {
    it('createSite creates a site with companyId', async () => {
      const dto = { name: 'Test Site', location: 'Test', budget: 100000, startDate: '2025-01-15' };
      const expected = { id: 'site-1', ...dto, companyId, startDate: new Date('2025-01-15') };
      mockPrisma.constructionSite.create.mockResolvedValue(expected);

      const result = await service.createSite(dto, companyId);

      expect(result).toEqual(expected);
    });

    it('findAllSites returns paginated sites', async () => {
      const sites = [{ id: 'site-1', name: 'Site A' }];
      mockPrisma.constructionSite.count.mockResolvedValue(1);
      mockPrisma.constructionSite.findMany.mockResolvedValue(sites);

      const result = await service.findAllSites({ page: 1, limit: 10 }, companyId);

      expect(result.meta.total).toBe(1);
    });

    it('findOneSite returns site when found', async () => {
      mockPrisma.constructionSite.findFirst.mockResolvedValue({ id: 'site-1' });

      const result = await service.findOneSite('site-1', companyId);

      expect(result).toEqual({ id: 'site-1' });
    });

    it('findOneSite throws when site not found', async () => {
      mockPrisma.constructionSite.findFirst.mockResolvedValue(null);

      await expect(service.findOneSite('nonexistent', companyId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('Vendors', () => {
    it('createVendor creates vendor', async () => {
      const dto = { name: 'Vendor A', contactPerson: 'John', phone: '123', email: 'j@t.com' };
      mockPrisma.vendor.create.mockResolvedValue({ id: 'v-1', ...dto, companyId });

      const result = await service.createVendor(dto, companyId);

      expect(result.id).toBe('v-1');
    });

    it('findAllVendors returns paginated vendors', async () => {
      mockPrisma.vendor.count.mockResolvedValue(1);
      mockPrisma.vendor.findMany.mockResolvedValue([{ id: 'v-1' }]);

      const result = await service.findAllVendors({}, companyId);

      expect(result.data).toHaveLength(1);
    });
  });

  describe('Materials', () => {
    it('createMaterial clears soft-deleted duplicates and creates', async () => {
      mockPrisma.material.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.material.create.mockResolvedValue({ id: 'm-1', name: 'Cement', companyId });

      const result = await service.createMaterial({ name: 'Cement', category: 'Raw', unit: 'kg' }, companyId);

      expect(result.id).toBe('m-1');
      expect(mockPrisma.material.deleteMany).toHaveBeenCalledWith({
        where: { companyId, name: 'Cement', deletedAt: { not: null } },
      });
    });
  });

  describe('Material Inward', () => {
    it('createMaterialInward creates entry and upserts inventory', async () => {
      const dto = { vendorId: 'v-1', siteId: 's-1', materialId: 'm-1', quantity: 10, unitPrice: 100, receivedDate: '2025-02-01' };
      mockPrisma.materialInward.create.mockResolvedValue({ id: 'mi-1', ...dto, companyId, totalAmount: 1000 });
      mockPrisma.inventoryItem.upsert.mockResolvedValue({});

      const result = await service.createMaterialInward(dto, companyId);

      expect(mockPrisma.inventoryItem.upsert).toHaveBeenCalledWith({
        where: { companyId_siteId_materialId: { companyId, siteId: 's-1', materialId: 'm-1' } },
        update: { quantityOnHand: { increment: 10 } },
        create: { companyId, siteId: 's-1', materialId: 'm-1', quantityOnHand: 10 },
      });
      expect(result.id).toBe('mi-1');
    });
  });

  describe('Labour', () => {
    it('createLabourEntry creates entry', async () => {
      const dto = { siteId: 's-1', labourName: 'John', labourType: 'SKILLED', date: '2025-03-01', wagesAmount: 1500 };
      mockPrisma.labourEntry.create.mockResolvedValue({ id: 'l-1', ...dto, companyId });

      const result = await service.createLabourEntry(dto, companyId);

      expect(result.id).toBe('l-1');
    });

    it('findAllLabourEntries returns entries filtered by siteId', async () => {
      mockPrisma.labourEntry.count.mockResolvedValue(1);
      mockPrisma.labourEntry.findMany.mockResolvedValue([{ id: 'l-1' }]);

      const result = await service.findAllLabourEntries({ siteId: 's-1' }, companyId);

      expect(result.data).toHaveLength(1);
    });
  });

  describe('Inventory', () => {
    it('findInventory returns items with site and material info', async () => {
      const items = [{ id: 'inv-1', quantityOnHand: 100 }];
      mockPrisma.inventoryItem.findMany.mockResolvedValue(items);

      const result = await service.findInventory({ siteId: 's-1' }, companyId);

      expect(result).toEqual(items);
    });
  });

  describe('Progress Photos', () => {
    it('createProgressPhoto creates photo', async () => {
      const dto = { siteId: 's-1', photoUrl: 'https://example.com/photo.jpg' };
      mockPrisma.progressPhoto.create.mockResolvedValue({ id: 'pp-1', ...dto, companyId });

      const result = await service.createProgressPhoto(dto, companyId);

      expect(result.id).toBe('pp-1');
    });

    it('findSitePhotos returns photos after verifying site exists', async () => {
      mockPrisma.constructionSite.findFirst.mockResolvedValue({ id: 's-1' });
      mockPrisma.progressPhoto.findMany.mockResolvedValue([{ id: 'pp-1' }]);

      const result = await service.findSitePhotos('s-1', companyId);

      expect(result).toHaveLength(1);
    });

    it('findSitePhotos throws when site not found', async () => {
      mockPrisma.constructionSite.findFirst.mockResolvedValue(null);

      await expect(service.findSitePhotos('nonexistent', companyId)).rejects.toThrow(NotFoundException);
    });
  });
});
