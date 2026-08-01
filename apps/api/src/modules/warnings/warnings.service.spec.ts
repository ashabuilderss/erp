import { BadRequestException } from '@nestjs/common';
import { WarningSeverity, WarningCategory, ApprovalStatus } from '@prisma/client';
import { WarningsService } from './warnings.service';

describe('WarningsService', () => {
  let service: WarningsService;
  let mockPrisma: any;
  let mockSpawningService: any;
  let mockEventPublisher: any;

  const companyId = 'company-1';
  const issuerUserId = 'user-1';
  const warningId = 'warn-1';

  const mockIssuerEmployee = { id: 'emp-issuer', userId: issuerUserId };
  const mockTargetEmployee = { id: 'emp-target', userId: 'user-2' };
  const mockCompany = { id: companyId, settings: {} };

  const mockWarning = {
    id: warningId,
    companyId,
    employeeId: mockTargetEmployee.id,
    issuerId: mockIssuerEmployee.id,
    category: WarningCategory.ATTENDANCE,
    severity: WarningSeverity.LEVEL_1_VERBAL,
    reason: 'Late attendance',
    status: ApprovalStatus.APPROVED,
    acknowledgedAt: null,
    expiresAt: new Date(),
  };

  const mockTx = {
    warning: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn(), findMany: jest.fn() },
    warningHistory: { create: jest.fn() },
    approvalRequest: { findFirst: jest.fn() },
  };

  beforeEach(() => {
    mockSpawningService = { spawnRequest: jest.fn() };
    mockEventPublisher = { publish: jest.fn() };
    mockPrisma = {
      $transaction: jest.fn().mockImplementation(async (cb: any) => cb(mockTx)),
      employee: { findFirst: jest.fn() },
      company: { findUnique: jest.fn() },
      warning: { findMany: jest.fn(), findFirst: jest.fn(), count: jest.fn() },
    };
    Object.values(mockTx).forEach((model: any) => {
      if (model.create) model.create.mockReset();
      if (model.findFirst) model.findFirst.mockReset();
      if (model.update) model.update.mockReset();
      if (model.findMany) model.findMany.mockReset();
    });
    service = new WarningsService(mockPrisma, mockSpawningService, mockEventPublisher);
  });

  const baseDto = {
    employeeId: mockTargetEmployee.id,
    category: WarningCategory.ATTENDANCE,
    severity: WarningSeverity.LEVEL_1_VERBAL,
    reason: 'Late attendance',
  };

  describe('issueWarning', () => {
    it('creates LEVEL_1 warning as auto-approved without approval', async () => {
      mockPrisma.employee.findFirst.mockResolvedValueOnce(mockIssuerEmployee);
      mockPrisma.employee.findFirst.mockResolvedValueOnce(mockTargetEmployee);
      mockPrisma.company.findUnique.mockResolvedValue(mockCompany);
      mockTx.warning.create.mockResolvedValue(mockWarning);
      mockTx.warning.findMany.mockResolvedValue([]);

      const result = await service.issueWarning(companyId, issuerUserId, baseDto);

      expect(result).toEqual(mockWarning);
      expect(mockSpawningService.spawnRequest).not.toHaveBeenCalled();
    });

    it('creates LEVEL_2 warning and spawns approval', async () => {
      mockPrisma.employee.findFirst.mockResolvedValueOnce(mockIssuerEmployee);
      mockPrisma.employee.findFirst.mockResolvedValueOnce(mockTargetEmployee);
      mockPrisma.company.findUnique.mockResolvedValue(mockCompany);
      const l2Warning = { ...mockWarning, severity: WarningSeverity.LEVEL_2_WRITTEN, status: ApprovalStatus.PENDING };
      mockTx.warning.create.mockResolvedValue(l2Warning);
      mockTx.warning.findMany.mockResolvedValue([]);
      mockSpawningService.spawnRequest.mockResolvedValue({ id: 'approval-1' });

      const result = await service.issueWarning(companyId, issuerUserId, {
        ...baseDto, severity: WarningSeverity.LEVEL_2_WRITTEN,
      });

      expect(result.status).toBe(ApprovalStatus.PENDING);
      expect(mockSpawningService.spawnRequest).toHaveBeenCalled();
    });

    it('allows system-generated warning without issuer', async () => {
      mockPrisma.employee.findFirst.mockResolvedValueOnce(null);
      mockPrisma.employee.findFirst.mockResolvedValueOnce(mockTargetEmployee);
      mockPrisma.company.findUnique.mockResolvedValue(mockCompany);
      mockTx.warning.create.mockResolvedValue(mockWarning);
      mockTx.warning.findMany.mockResolvedValue([]);

      const result = await service.issueWarning(companyId, issuerUserId, {
        ...baseDto, isSystemGenerated: true,
      });

      expect(result).toEqual(mockWarning);
    });

    it('triggers disciplinary review on 3x Level 1 accumulation', async () => {
      mockPrisma.employee.findFirst.mockResolvedValueOnce(mockIssuerEmployee);
      mockPrisma.employee.findFirst.mockResolvedValueOnce(mockTargetEmployee);
      mockPrisma.company.findUnique.mockResolvedValue(mockCompany);
      mockTx.warning.create.mockResolvedValue(mockWarning);
      mockTx.warning.findMany.mockResolvedValue([
        { severity: WarningSeverity.LEVEL_1_VERBAL },
        { severity: WarningSeverity.LEVEL_1_VERBAL },
        { severity: WarningSeverity.LEVEL_1_VERBAL },
      ]);
      mockTx.approvalRequest.findFirst.mockResolvedValue(null);
      mockSpawningService.spawnRequest.mockResolvedValue({ id: 'review-1' });

      await service.issueWarning(companyId, issuerUserId, baseDto);

      expect(mockSpawningService.spawnRequest).toHaveBeenCalledWith(
        companyId, 'DISCIPLINARY_REVIEW', mockTargetEmployee.id, issuerUserId,
      );
    });
  });

  describe('acknowledgeWarning', () => {
    it('acknowledges warning when conditions met', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue(mockIssuerEmployee);
      mockTx.warning.findFirst.mockResolvedValue({ ...mockWarning, employeeId: mockIssuerEmployee.id, status: ApprovalStatus.APPROVED });
      mockTx.warning.update.mockResolvedValue({ ...mockWarning, acknowledgedAt: new Date() });

      const result = await service.acknowledgeWarning(companyId, warningId, 'user-2');

      expect(result.acknowledgedAt).toBeDefined();
    });

    it('throws when warning not found', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue(mockIssuerEmployee);
      mockTx.warning.findFirst.mockResolvedValue(null);

      await expect(service.acknowledgeWarning(companyId, 'nonexistent', 'user-2')).rejects.toThrow(BadRequestException);
    });

    it('throws when wrong employee acknowledges', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue(mockIssuerEmployee);
      mockTx.warning.findFirst.mockResolvedValue({ ...mockWarning, employeeId: 'other-emp', status: ApprovalStatus.APPROVED });

      await expect(service.acknowledgeWarning(companyId, warningId, 'user-2')).rejects.toThrow(BadRequestException);
    });

    it('throws when warning not yet approved', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue(mockIssuerEmployee);
      mockTx.warning.findFirst.mockResolvedValue({ ...mockWarning, employeeId: mockIssuerEmployee.id, status: ApprovalStatus.PENDING });

      await expect(service.acknowledgeWarning(companyId, warningId, 'user-2')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('returns paginated warnings with filters', async () => {
      mockPrisma.warning.findMany.mockResolvedValue([mockWarning]);
      mockPrisma.warning.count.mockResolvedValue(1);

      const result = await service.findAll(companyId, { employeeId: 'emp-1', severity: 'LEVEL_1_VERBAL' });

      expect(result.items).toHaveLength(1);
    });
  });

  describe('findMyWarnings', () => {
    it('resolves employee and defaults to APPROVED', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue(mockTargetEmployee);
      mockPrisma.warning.findMany.mockResolvedValue([mockWarning]);
      mockPrisma.warning.count.mockResolvedValue(1);

      const result = await service.findMyWarnings(companyId, 'user-2', {});

      expect(result.items).toHaveLength(1);
    });

    it('throws when employee not found', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue(null);

      await expect(service.findMyWarnings(companyId, 'unknown', {})).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('returns warning with histories', async () => {
      mockPrisma.warning.findFirst.mockResolvedValue({ ...mockWarning, warningHistories: [] });

      const result = await service.findOne(companyId, warningId);

      expect(result.warningHistories).toEqual([]);
    });

    it('throws when warning not found', async () => {
      mockPrisma.warning.findFirst.mockResolvedValue(null);

      await expect(service.findOne(companyId, 'nonexistent')).rejects.toThrow(BadRequestException);
    });
  });
});
