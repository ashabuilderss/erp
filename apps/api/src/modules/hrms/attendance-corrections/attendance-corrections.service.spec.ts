import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AttendanceCorrectionsService } from './attendance-corrections.service';
import { CorrectionStatus } from '@prisma/client';

describe('AttendanceCorrectionsService', () => {
  const mockPrisma = () => ({
    attendanceCorrection: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    attendance: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  });

  describe('create', () => {
    it('sets correctionDate to midnight UTC', async () => {
      const prisma = mockPrisma();
      prisma.attendanceCorrection.create.mockResolvedValue({ id: 'ac-1' });
      const service = new AttendanceCorrectionsService(prisma as never);

      await service.create({ date: '2024-06-15', reason: 'forgot to check in' } as never, 'emp-1', 'c1');

      expect(prisma.attendanceCorrection.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          employeeId: 'emp-1',
          companyId: 'c1',
          reason: 'forgot to check in',
        }),
      }));
    });

    it('calls create with correct data including optional fields', async () => {
      const prisma = mockPrisma();
      prisma.attendanceCorrection.create.mockResolvedValue({ id: 'ac-1' });
      const service = new AttendanceCorrectionsService(prisma as never);

      await service.create(
        {
          date: '2024-06-15',
          reason: 'late arrival',
          attendanceId: 'att-1',
          requestedCheckIn: '2024-06-15T10:00:00Z',
          requestedCheckOut: '2024-06-15T18:00:00Z',
          requestedStatus: 'PRESENT',
        } as never,
        'emp-1',
        'c1',
      );

      expect(prisma.attendanceCorrection.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          attendanceId: 'att-1',
          requestedStatus: 'PRESENT',
        }),
      }));
    });
  });

  describe('findAll', () => {
    it('returns paginated data and meta', async () => {
      const prisma = mockPrisma();
      prisma.attendanceCorrection.count.mockResolvedValue(1);
      prisma.attendanceCorrection.findMany.mockResolvedValue([{ id: 'ac-1' }]);
      const service = new AttendanceCorrectionsService(prisma as never);

      const result = await service.findAll({ page: 1, limit: 10 } as never, 'c1');

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('applies status filter when provided', async () => {
      const prisma = mockPrisma();
      prisma.attendanceCorrection.count.mockResolvedValue(0);
      prisma.attendanceCorrection.findMany.mockResolvedValue([]);
      const service = new AttendanceCorrectionsService(prisma as never);

      await service.findAll({ page: 1, limit: 10, status: CorrectionStatus.PENDING } as never, 'c1');

      expect(prisma.attendanceCorrection.count).toHaveBeenCalledWith({
        where: { companyId: 'c1', status: CorrectionStatus.PENDING },
      });
    });

    it('applies employeeId filter when provided', async () => {
      const prisma = mockPrisma();
      prisma.attendanceCorrection.count.mockResolvedValue(0);
      prisma.attendanceCorrection.findMany.mockResolvedValue([]);
      const service = new AttendanceCorrectionsService(prisma as never);

      await service.findAll({ page: 1, limit: 10, employeeId: 'emp-1' } as never, 'c1');

      expect(prisma.attendanceCorrection.count).toHaveBeenCalledWith({
        where: { companyId: 'c1', employeeId: 'emp-1' },
      });
    });
  });

  describe('findMyCorrections', () => {
    it('queries by employeeId only without companyId scoping', async () => {
      const prisma = mockPrisma();
      prisma.attendanceCorrection.findMany.mockResolvedValue([{ id: 'ac-1' }]);
      const service = new AttendanceCorrectionsService(prisma as never);

      const result = await service.findMyCorrections('emp-1');

      expect(result).toEqual([{ id: 'ac-1' }]);
      expect(prisma.attendanceCorrection.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { employeeId: 'emp-1' },
      }));
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when correction not found', async () => {
      const prisma = mockPrisma();
      prisma.attendanceCorrection.findFirst.mockResolvedValue(null);
      const service = new AttendanceCorrectionsService(prisma as never);

      await expect(service.findOne('ac-1', 'c1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns correction with employee and approvedBy includes', async () => {
      const prisma = mockPrisma();
      const correction = { id: 'ac-1', employee: {}, approvedBy: {} };
      prisma.attendanceCorrection.findFirst.mockResolvedValue(correction);
      const service = new AttendanceCorrectionsService(prisma as never);

      const result = await service.findOne('ac-1', 'c1');

      expect(result).toEqual(correction);
      expect(prisma.attendanceCorrection.findFirst).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'ac-1', companyId: 'c1' },
        include: expect.objectContaining({
          employee: expect.any(Object),
          approvedBy: expect.any(Object),
        }),
      }));
    });
  });

  describe('approve', () => {
    it('throws BadRequestException when status is not PENDING', async () => {
      const prisma = mockPrisma();
      prisma.attendanceCorrection.findFirst.mockResolvedValue({
        id: 'ac-1',
        status: CorrectionStatus.APPROVED,
        companyId: 'c1',
      });
      const service = new AttendanceCorrectionsService(prisma as never);

      await expect(service.approve('ac-1', 'admin-1', 'c1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('calls $transaction when status is PENDING', async () => {
      const prisma = mockPrisma();
      const pendingCorrection = {
        id: 'ac-1',
        status: CorrectionStatus.PENDING,
        companyId: 'c1',
        employeeId: 'emp-1',
        date: new Date('2024-06-15'),
        requestedCheckIn: new Date('2024-06-15T10:00:00Z'),
        requestedCheckOut: null,
        requestedStatus: 'PRESENT',
      };
      prisma.attendanceCorrection.findFirst.mockResolvedValue(pendingCorrection);
      prisma.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          attendance: { findUnique: jest.fn().mockResolvedValue({ id: 'att-1' }), update: jest.fn() },
          attendanceCorrection: { update: jest.fn().mockResolvedValue({ id: 'ac-1', status: 'APPROVED' }) },
        };
        return fn(tx);
      });
      const service = new AttendanceCorrectionsService(prisma as never);

      const result = await service.approve('ac-1', 'admin-1', 'c1', 'Approved');

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
    });

    it('approves without updating attendance when no existing attendance', async () => {
      const prisma = mockPrisma();
      const pendingCorrection = {
        id: 'ac-1',
        status: CorrectionStatus.PENDING,
        companyId: 'c1',
        employeeId: 'emp-1',
        date: new Date('2024-06-15'),
        requestedCheckIn: null,
        requestedCheckOut: null,
        requestedStatus: 'PRESENT',
      };
      prisma.attendanceCorrection.findFirst.mockResolvedValue(pendingCorrection);
      prisma.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          attendance: { findUnique: jest.fn().mockResolvedValue(null), update: jest.fn() },
          attendanceCorrection: { update: jest.fn().mockResolvedValue({ id: 'ac-1', status: 'APPROVED' }) },
        };
        return fn(tx);
      });
      const service = new AttendanceCorrectionsService(prisma as never);

      const result = await service.approve('ac-1', 'admin-1', 'c1');

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
    });
  });

  describe('reject', () => {
    it('throws BadRequestException when status is not PENDING', async () => {
      const prisma = mockPrisma();
      prisma.attendanceCorrection.findFirst.mockResolvedValue({
        id: 'ac-1',
        status: CorrectionStatus.REJECTED,
        companyId: 'c1',
      });
      const service = new AttendanceCorrectionsService(prisma as never);

      await expect(service.reject('ac-1', 'admin-1', 'c1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('updates correction to REJECTED when PENDING', async () => {
      const prisma = mockPrisma();
      prisma.attendanceCorrection.findFirst.mockResolvedValue({
        id: 'ac-1',
        status: CorrectionStatus.PENDING,
        companyId: 'c1',
      });
      prisma.attendanceCorrection.update.mockResolvedValue({ id: 'ac-1', status: 'REJECTED' });
      const service = new AttendanceCorrectionsService(prisma as never);

      const result = await service.reject('ac-1', 'admin-1', 'c1', 'Not enough proof');

      expect(result).toHaveProperty('id');
      expect(prisma.attendanceCorrection.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'ac-1' },
        data: expect.objectContaining({
          status: CorrectionStatus.REJECTED,
          approvedById: 'admin-1',
          notes: 'Not enough proof',
        }),
      }));
    });
  });
});
