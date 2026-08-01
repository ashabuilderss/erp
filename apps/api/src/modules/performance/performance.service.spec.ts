import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PerformancePeriod, TrendDirection, TaskStatus } from '@prisma/client';
import { PerformanceService } from './performance.service';

describe('PerformanceService', () => {
  const companyId = 'comp-1';
  const employeeId = 'emp-1';
  const userId = 'usr-1';

  const mockPrisma = () => ({
    task: { findMany: jest.fn() },
    attendanceSummary: { findMany: jest.fn() },
    eodReport: { findMany: jest.fn() },
    performanceScore: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    managerRating: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    performanceTrendSnapshot: { findMany: jest.fn() },
    employee: { findMany: jest.fn() },
    $transaction: jest.fn(),
  });

  const mockEventPublisher = () => ({
    publish: jest.fn(),
  });

  const mockEngine = () => ({
    calculate: jest.fn(),
  });

  const buildService = (overrides?: {
    prisma?: ReturnType<typeof mockPrisma>;
    eventPublisher?: ReturnType<typeof mockEventPublisher>;
    engine?: ReturnType<typeof mockEngine>;
  }) => {
    const prisma = overrides?.prisma ?? mockPrisma();
    const eventPublisher = overrides?.eventPublisher ?? mockEventPublisher();
    const engine = overrides?.engine ?? mockEngine();
    const service = new PerformanceService(
      prisma as never,
      eventPublisher as never,
      engine as never,
    );
    return { service, prisma, eventPublisher, engine };
  };

  describe('calculateScore', () => {
    it('creates a PerformanceScore and publishes event', async () => {
      const { service, prisma, eventPublisher, engine } = buildService();
      prisma.task.findMany.mockResolvedValue([]);
      prisma.attendanceSummary.findMany.mockResolvedValue([]);
      prisma.eodReport.findMany.mockResolvedValue([]);
      prisma.performanceScore.findFirst.mockResolvedValue(null);
      prisma.$transaction.mockImplementation(async (fn: Function) => {
        const tx = {
          performanceScore: {
            create: jest.fn().mockResolvedValue({ id: 'score-1' }),
          },
        };
        return fn(tx);
      });
      engine.calculate.mockReturnValue({
        taskScore: 50,
        attendanceScore: 50,
        eodScore: 50,
        managerScore: 0,
        compositeScore: 37.5,
        trend: TrendDirection.STABLE,
        scoreDelta: null,
      });

      const result = await service.calculateScore({
        companyId,
        employeeId,
        period: '2026-01',
        periodType: PerformancePeriod.MONTHLY,
        calculatedById: userId,
      });

      expect(result).toBe('score-1');
      expect(engine.calculate).toHaveBeenCalledWith(
        expect.objectContaining({
          taskScore: 50,
          attendanceScore: 50,
          eodScore: 50,
          managerScore: 0,
        }),
      );
      expect(eventPublisher.publish).toHaveBeenCalled();
    });

    it('returns 50 for each component when no data exists', async () => {
      const { service, prisma, engine } = buildService();
      prisma.task.findMany.mockResolvedValue([]);
      prisma.attendanceSummary.findMany.mockResolvedValue([]);
      prisma.eodReport.findMany.mockResolvedValue([]);
      prisma.performanceScore.findFirst.mockResolvedValue(null);
      prisma.$transaction.mockImplementation(async (fn: Function) => {
        const tx = {
          performanceScore: {
            create: jest.fn().mockResolvedValue({ id: 'score-1' }),
          },
        };
        return fn(tx);
      });
      engine.calculate.mockReturnValue({
        taskScore: 50,
        attendanceScore: 50,
        eodScore: 50,
        managerScore: 0,
        compositeScore: 37.5,
        trend: TrendDirection.STABLE,
        scoreDelta: null,
      });

      await service.calculateScore({
        companyId,
        employeeId,
        period: '2026-01',
        periodType: PerformancePeriod.MONTHLY,
      });

      expect(engine.calculate).toHaveBeenCalledWith(
        expect.objectContaining({
          taskScore: 50,
          attendanceScore: 50,
          eodScore: 50,
          managerScore: 0,
        }),
      );
    });

    it('computes task score as percentage of completed tasks', async () => {
      const { service, prisma, engine } = buildService();
      prisma.task.findMany.mockResolvedValue([
        { status: TaskStatus.COMPLETED },
        { status: TaskStatus.COMPLETED },
        { status: TaskStatus.IN_PROGRESS },
      ]);
      prisma.attendanceSummary.findMany.mockResolvedValue([]);
      prisma.eodReport.findMany.mockResolvedValue([]);
      prisma.performanceScore.findFirst.mockResolvedValue(null);
      prisma.$transaction.mockImplementation(async (fn: Function) => {
        const tx = {
          performanceScore: {
            create: jest.fn().mockResolvedValue({ id: 'score-1' }),
          },
        };
        return fn(tx);
      });
      engine.calculate.mockReturnValue({
        taskScore: 67,
        attendanceScore: 50,
        eodScore: 50,
        managerScore: 0,
        compositeScore: 45.1,
        trend: TrendDirection.STABLE,
        scoreDelta: null,
      });

      await service.calculateScore({
        companyId,
        employeeId,
        period: '2026-01',
        periodType: PerformancePeriod.MONTHLY,
      });

      expect(engine.calculate).toHaveBeenCalledWith(
        expect.objectContaining({
          taskScore: 67,
        }),
      );
    });
  });

  describe('rateEmployee', () => {
    it('throws BadRequestException for score < 1', async () => {
      const { service } = buildService();

      await expect(
        service.rateEmployee({
          companyId,
          performanceScoreId: 'ps-1',
          ratedById: userId,
          score: 0,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException for score > 10', async () => {
      const { service } = buildService();

      await expect(
        service.rateEmployee({
          companyId,
          performanceScoreId: 'ps-1',
          ratedById: userId,
          score: 11,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws NotFoundException when performance score not found', async () => {
      const { service, prisma } = buildService();
      prisma.performanceScore.findFirst.mockResolvedValue(null);

      await expect(
        service.rateEmployee({
          companyId,
          performanceScoreId: 'ps-1',
          ratedById: userId,
          score: 5,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('creates ManagerRating and recalculates composite', async () => {
      const { service, prisma, engine } = buildService();
      prisma.performanceScore.findFirst.mockResolvedValue({
        id: 'ps-1',
        companyId,
        employeeId,
        period: '2026-01',
        periodType: PerformancePeriod.MONTHLY,
        taskScore: 80,
        attendanceScore: 90,
        eodScore: 70,
        managerScore: 0,
        compositeScore: 71.5,
      });
      prisma.managerRating.findMany.mockResolvedValue([{ score: 7 }]);
      prisma.performanceScore.findFirst
        .mockResolvedValueOnce({
          id: 'ps-1',
          companyId,
          employeeId,
          period: '2026-01',
          periodType: PerformancePeriod.MONTHLY,
          taskScore: 80,
          attendanceScore: 90,
          eodScore: 70,
          managerScore: 0,
          compositeScore: 71.5,
        })
        .mockResolvedValueOnce(null);
      const mockTxManagerRating = {
        create: jest.fn().mockResolvedValue({ id: 'rating-1' }),
        findMany: jest.fn().mockResolvedValue([{ score: 7 }]),
      };
      const mockTxPerformanceScore = {
        create: jest.fn().mockResolvedValue({ id: 'ps-2' }),
      };
      prisma.$transaction.mockImplementation(async (fn: Function) => {
        const tx = {
          managerRating: mockTxManagerRating,
          performanceScore: mockTxPerformanceScore,
        };
        return fn(tx);
      });
      engine.calculate.mockReturnValue({
        taskScore: 80,
        attendanceScore: 90,
        eodScore: 70,
        managerScore: 70,
        compositeScore: 80.5,
        trend: TrendDirection.IMPROVING,
        scoreDelta: 9,
      });

      const result = await service.rateEmployee({
        companyId,
        performanceScoreId: 'ps-1',
        ratedById: userId,
        score: 7,
        comment: 'Good work',
      });

      expect(result).toBe('rating-1');
    });
  });

  describe('getScore', () => {
    it('throws NotFoundException when score not found', async () => {
      const { service, prisma } = buildService();
      prisma.performanceScore.findFirst.mockResolvedValue(null);

      await expect(service.getScore('ps-1', companyId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns the score when found', async () => {
      const { service, prisma } = buildService();
      const mockScore = { id: 'ps-1', companyId, compositeScore: 85 };
      prisma.performanceScore.findFirst.mockResolvedValue(mockScore);

      const result = await service.getScore('ps-1', companyId);
      expect(result).toEqual(mockScore);
    });
  });

  describe('getTrends', () => {
    it('returns trend snapshots with default limit 12', async () => {
      const { service, prisma } = buildService();
      prisma.performanceTrendSnapshot.findMany.mockResolvedValue([]);

      const result = await service.getTrends({ companyId });
      expect(result).toEqual([]);
      expect(prisma.performanceTrendSnapshot.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 12 }),
      );
    });
  });

  describe('listScores', () => {
    it('returns paginated results with meta', async () => {
      const { service, prisma } = buildService();
      prisma.performanceScore.findMany.mockResolvedValue([]);
      prisma.performanceScore.count.mockResolvedValue(0);

      const result = await service.listScores(companyId, {
        page: 1,
        limit: 10,
      });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.meta).toEqual(
        expect.objectContaining({ total: 0, page: 1, limit: 10 }),
      );
    });
  });
});
