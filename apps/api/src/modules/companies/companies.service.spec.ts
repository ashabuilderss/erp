import { CompaniesService } from './companies.service';

describe('CompaniesService tenant access', () => {
  it('only lists the current company', async () => {
    const prisma = { company: { findMany: jest.fn().mockResolvedValue([]) } };
    const encryptionService = { encrypt: jest.fn(), decrypt: jest.fn() };
    const service = new CompaniesService(prisma as never, encryptionService as never);
    await service.findAll('company-1');
    expect(prisma.company.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'company-1' } }),
    );
  });
});
