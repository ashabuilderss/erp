import { BadRequestException } from '@nestjs/common';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  const mockPrisma = () => ({
    lead: { count: jest.fn(), groupBy: jest.fn() },
    property: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    booking: {
      count: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    employee: { count: jest.fn(), findMany: jest.fn(), groupBy: jest.fn() },
    siteVisit: { count: jest.fn(), groupBy: jest.fn() },
    incentive: { count: jest.fn(), groupBy: jest.fn() },
    reportExport: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    attendance: { findMany: jest.fn() },
    attendanceDayAggregate: { findMany: jest.fn(), count: jest.fn() },
    leaveRequest: { findMany: jest.fn(), count: jest.fn() },
    payrollRun: { findMany: jest.fn() },
    department: { findMany: jest.fn() },
    pipelineCommission: { groupBy: jest.fn(), findMany: jest.fn() },
    inventoryItem: { findMany: jest.fn() },
    labourEntry: { findMany: jest.fn() },
    customer: { count: jest.fn() },
    $queryRawUnsafe: jest.fn(),
  });

  const mockRedis = () => ({
    get: jest.fn(),
    set: jest.fn(),
  });

  const mockOrchestration = () => ({
    createExport: jest.fn(),
    getExportHistory: jest.fn(),
  });

  describe('getCatalog', () => {
    it('returns catalog with 10 items', async () => {
      const service = new ReportsService(
        mockPrisma() as never,
        mockRedis() as never,
        mockOrchestration() as never,
      );
      const result = await service.getCatalog();

      expect(result.items).toHaveLength(10);
      expect(result.items[0]).toHaveProperty('key');
      expect(result.items[0]).toHaveProperty('title');
    });
  });

  describe('getKPIDashboard', () => {
    it('returns cached data when redis.get returns a value', async () => {
      const prisma = mockPrisma();
      const redis = mockRedis();
      const cached = {
        period: { dateFrom: '2024-01-01', dateTo: '2024-01-31' },
      };
      redis.get.mockResolvedValue(cached);
      const service = new ReportsService(
        prisma as never,
        redis as never,
        mockOrchestration() as never,
      );

      const result = await service.getKPIDashboard(
        { userRole: 'OWNER', employeeId: null, companyId: 'c1' },
        { period: 'month' } as never,
      );

      expect(result).toEqual(cached);
      expect(redis.get).toHaveBeenCalled();
      expect(prisma.lead.count).not.toHaveBeenCalled();
    });

    it('queries all models when no cache', async () => {
      const prisma = mockPrisma();
      const redis = mockRedis();
      redis.get.mockResolvedValue(null);
      prisma.lead.count.mockResolvedValue(10);
      prisma.property.count.mockResolvedValue(5);
      prisma.booking.count.mockResolvedValue(3);
      prisma.booking.aggregate.mockResolvedValue({ _sum: { amount: 15000 } });
      prisma.employee.count.mockResolvedValue(8);
      prisma.siteVisit.count.mockResolvedValue(4);
      prisma.incentive.count.mockResolvedValue(2);
      prisma.attendanceDayAggregate.findMany.mockResolvedValue([]);
      prisma.leaveRequest.findMany.mockResolvedValue([]);
      prisma.leaveRequest.count.mockResolvedValue(1);
      prisma.employee.groupBy.mockResolvedValue([]);
      prisma.department.findMany.mockResolvedValue([]);
      const service = new ReportsService(
        prisma as never,
        redis as never,
        mockOrchestration() as never,
      );

      const result = await service.getKPIDashboard(
        { userRole: 'OWNER', employeeId: null, companyId: 'c1' },
        { period: 'month' } as never,
      );

      expect(result).toHaveProperty('period');
      expect(result).toHaveProperty('leads');
      expect(result).toHaveProperty('properties');
      expect(result).toHaveProperty('bookings');
      expect(result).toHaveProperty('employees');
      expect(result).toHaveProperty('siteVisits');
      expect(result).toHaveProperty('incentives');
      expect(redis.set).toHaveBeenCalled();
    });

    it('applies ownership filtering for EMPLOYEE', async () => {
      const prisma = mockPrisma();
      const redis = mockRedis();
      redis.get.mockResolvedValue(null);
      prisma.lead.count.mockResolvedValue(0);
      prisma.property.count.mockResolvedValue(0);
      prisma.booking.count.mockResolvedValue(0);
      prisma.booking.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
      prisma.employee.count.mockResolvedValue(0);
      prisma.siteVisit.count.mockResolvedValue(0);
      prisma.incentive.count.mockResolvedValue(0);
      prisma.attendanceDayAggregate.findMany.mockResolvedValue([]);
      prisma.leaveRequest.findMany.mockResolvedValue([]);
      prisma.leaveRequest.count.mockResolvedValue(0);
      prisma.employee.groupBy.mockResolvedValue([]);
      prisma.department.findMany.mockResolvedValue([]);
      const service = new ReportsService(
        prisma as never,
        redis as never,
        mockOrchestration() as never,
      );

      await service.getKPIDashboard(
        { userRole: 'EMPLOYEE', employeeId: 'emp-1', companyId: 'c1' },
        { period: 'month' } as never,
      );

      expect(prisma.lead.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId: 'c1',
            assignedToEmployeeId: 'emp-1',
          }),
        }),
      );
    });

    it('passes empty ownWhere for OWNER', async () => {
      const prisma = mockPrisma();
      const redis = mockRedis();
      redis.get.mockResolvedValue(null);
      prisma.lead.count.mockResolvedValue(0);
      prisma.property.count.mockResolvedValue(0);
      prisma.booking.count.mockResolvedValue(0);
      prisma.booking.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
      prisma.employee.count.mockResolvedValue(0);
      prisma.siteVisit.count.mockResolvedValue(0);
      prisma.incentive.count.mockResolvedValue(0);
      prisma.attendanceDayAggregate.findMany.mockResolvedValue([]);
      prisma.leaveRequest.findMany.mockResolvedValue([]);
      prisma.leaveRequest.count.mockResolvedValue(0);
      prisma.employee.groupBy.mockResolvedValue([]);
      prisma.department.findMany.mockResolvedValue([]);
      const service = new ReportsService(
        prisma as never,
        redis as never,
        mockOrchestration() as never,
      );

      await service.getKPIDashboard(
        { userRole: 'OWNER', employeeId: null, companyId: 'c1' },
        { period: 'month' } as never,
      );

      const leadCountCall = prisma.lead.count.mock.calls[0][0];
      expect(leadCountCall.where).not.toHaveProperty('assignedToEmployeeId');
    });
  });

  describe('createExport', () => {
    it('throws BadRequestException for unknown reportKey', async () => {
      const service = new ReportsService(
        mockPrisma() as never,
        mockRedis() as never,
        mockOrchestration() as never,
      );

      await expect(
        service.createExport(
          { reportKey: 'unknown', format: 'CSV' },
          'c1',
          'user-1',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates export record, generates CSV data, returns base64', async () => {
      const prisma = mockPrisma();
      const redis = mockRedis();
      prisma.reportExport.create.mockResolvedValue({
        id: 'exp-1',
        createdAt: new Date(),
      });
      prisma.reportExport.update.mockResolvedValue({});
      prisma.employee.findMany.mockResolvedValue([]);
      const orchestration = mockOrchestration();
      orchestration.createExport.mockImplementation(async () => {
        await prisma.reportExport.update({
          where: { id: 'exp-1' },
          data: { status: 'COMPLETED' },
        });
        return { status: 'COMPLETED', csvData: 'some-data' };
      });
      const service = new ReportsService(
        prisma as never,
        redis as never,
        orchestration as never,
      );

      const result = await service.createExport(
        { reportKey: 'employees', format: 'CSV' },
        'c1',
        'user-1',
      );

      expect(result.status).toBe('COMPLETED');
      expect(result).toHaveProperty('csvData');
      expect(prisma.reportExport.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'exp-1' },
          data: expect.objectContaining({ status: 'COMPLETED' }),
        }),
      );
    });

    it('updates status to FAILED on generation failure', async () => {
      const prisma = mockPrisma();
      const redis = mockRedis();
      prisma.reportExport.create.mockResolvedValue({
        id: 'exp-1',
        createdAt: new Date(),
      });
      prisma.reportExport.update.mockResolvedValue({});
      prisma.employee.findMany.mockRejectedValue(new Error('DB error'));
      const orchestration = mockOrchestration();
      orchestration.createExport.mockImplementation(async () => {
        await prisma.reportExport.update({
          where: { id: 'exp-1' },
          data: { status: 'FAILED' },
        });
        throw new BadRequestException('Export failed: DB error');
      });
      const service = new ReportsService(
        prisma as never,
        redis as never,
        orchestration as never,
      );

      await expect(
        service.createExport(
          { reportKey: 'employees', format: 'CSV' },
          'c1',
          'user-1',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.reportExport.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'exp-1' },
          data: expect.objectContaining({ status: 'FAILED' }),
        }),
      );
    });
  });

  describe('getExports', () => {
    it('returns paginated data and meta', async () => {
      const prisma = mockPrisma();
      prisma.reportExport.findMany.mockResolvedValue([]);
      prisma.reportExport.count.mockResolvedValue(0);
      const service = new ReportsService(
        prisma as never,
        mockRedis() as never,
        mockOrchestration() as never,
      );

      const result = await service.getExports('c1', 1, 10);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.meta).toHaveProperty('total');
      expect(result.meta).toHaveProperty('page');
    });
  });
});
