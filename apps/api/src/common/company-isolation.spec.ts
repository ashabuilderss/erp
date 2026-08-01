describe('Company Isolation - Service Query Scoping', () => {
  describe('ReportsService company isolation', () => {
    const mockPrisma = () => ({
      lead: {
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      property: {
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      booking: {
        count: jest.fn().mockResolvedValue(0),
        aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 0 } }),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      employee: {
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      siteVisit: {
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      incentive: {
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      leaveRequest: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
      attendanceDayAggregate: { findMany: jest.fn().mockResolvedValue([]) },
      department: { findMany: jest.fn().mockResolvedValue([]) },
      pipelineCommission: { groupBy: jest.fn().mockResolvedValue([]) },
      reportExport: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      $queryRawUnsafe: jest.fn().mockResolvedValue([]),
    });

    const mockRedis = () => ({
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn(),
    });
    const mockOrchestration = () => ({
      createExport: jest.fn(),
      getExportHistory: jest.fn(),
    });

    it('passes companyId to all KPI queries', async () => {
      const prisma = mockPrisma();
      const redis = mockRedis();
      const { ReportsService } =
        await import('../modules/reports/reports.service');
      const service = new ReportsService(
        prisma as never,
        redis as never,
        mockOrchestration() as never,
      );

      await service.getKPIDashboard(
        { userRole: 'OWNER', employeeId: null, companyId: 'comp-abc' },
        { period: 'month' } as never,
      );

      expect(prisma.lead.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ companyId: 'comp-abc' }),
        }),
      );
      expect(prisma.property.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ companyId: 'comp-abc' }),
        }),
      );
      expect(prisma.booking.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ companyId: 'comp-abc' }),
        }),
      );
      expect(prisma.employee.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ companyId: 'comp-abc' }),
        }),
      );
    });

    it('never queries without companyId', async () => {
      const prisma = mockPrisma();
      const redis = mockRedis();
      const { ReportsService } =
        await import('../modules/reports/reports.service');
      const service = new ReportsService(
        prisma as never,
        redis as never,
        mockOrchestration() as never,
      );

      await service.getKPIDashboard(
        { userRole: 'OWNER', employeeId: null, companyId: 'comp-xyz' },
        { period: 'month' } as never,
      );

      for (const call of prisma.lead.count.mock.calls) {
        expect(call[0].where).toHaveProperty('companyId', 'comp-xyz');
      }
      for (const call of prisma.property.count.mock.calls) {
        expect(call[0].where).toHaveProperty('companyId', 'comp-xyz');
      }
    });
  });

  describe('PerformanceService company isolation', () => {
    it('scopes all queries to companyId', async () => {
      const prisma = {
        task: { findMany: jest.fn().mockResolvedValue([]) },
        attendanceSummary: { findMany: jest.fn().mockResolvedValue([]) },
        eodReport: { findMany: jest.fn().mockResolvedValue([]) },
        performanceScore: {
          create: jest.fn().mockResolvedValue({ id: 'ps-1' }),
          findFirst: jest.fn().mockResolvedValue(null),
          findMany: jest.fn().mockResolvedValue([]),
          count: jest.fn().mockResolvedValue(0),
          groupBy: jest.fn().mockResolvedValue([]),
        },
        managerRating: {
          create: jest.fn(),
          findMany: jest.fn().mockResolvedValue([]),
        },
        performanceTrendSnapshot: { findMany: jest.fn().mockResolvedValue([]) },
        employee: { findMany: jest.fn().mockResolvedValue([]) },
        $transaction: jest.fn().mockImplementation(async (fn: Function) => {
          const tx = {
            performanceScore: {
              create: jest.fn().mockResolvedValue({ id: 'ps-1' }),
            },
          };
          return fn(tx);
        }),
      };
      const eventPublisher = { publish: jest.fn() };
      const engine = {
        calculate: jest.fn().mockReturnValue({
          taskScore: 50,
          attendanceScore: 50,
          eodScore: 50,
          managerScore: 0,
          compositeScore: 37.5,
          trend: 'STABLE',
          scoreDelta: null,
        }),
      };

      const { PerformanceService } =
        await import('../modules/performance/performance.service');
      const service = new PerformanceService(
        prisma as never,
        eventPublisher as never,
        engine as never,
      );

      await service.calculateScore({
        companyId: 'comp-isolated',
        employeeId: 'emp-1',
        period: '2026-01',
        periodType: 'MONTHLY',
      });

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ companyId: 'comp-isolated' }),
        }),
      );
      expect(prisma.attendanceSummary.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ companyId: 'comp-isolated' }),
        }),
      );
      expect(prisma.eodReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ companyId: 'comp-isolated' }),
        }),
      );
    });
  });

  describe('AnnouncementService company isolation', () => {
    it('queries announcements scoped to companyId', async () => {
      const prisma = {
        announcement: {
          findMany: jest.fn().mockResolvedValue([]),
          count: jest.fn().mockResolvedValue(0),
          findFirst: jest.fn().mockResolvedValue(null),
        },
        employee: { findMany: jest.fn().mockResolvedValue([]) },
        $transaction: jest.fn(),
      };
      const eventPublisher = { publish: jest.fn() };
      const notificationsService = { create: jest.fn() };
      const auditService = { record: jest.fn() };

      const { AnnouncementService } =
        await import('../modules/communication/announcement.service');
      const service = new AnnouncementService(
        prisma as never,
        eventPublisher as never,
        notificationsService as never,
        auditService,
        { validate: jest.fn(), canTransition: jest.fn().mockReturnValue(true), execute: jest.fn(), getRule: jest.fn() } as never,
      );

      await service.listAnnouncements('comp-scoped', { page: 1, limit: 10 });

      expect(prisma.announcement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ companyId: 'comp-scoped' }),
        }),
      );
      expect(prisma.announcement.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ companyId: 'comp-scoped' }),
        }),
      );
    });
  });

  describe('DocumentRegistryService company isolation', () => {
    it('queries documents scoped to companyId', async () => {
      const prisma = {
        documentRegistry: {
          findMany: jest.fn().mockResolvedValue([]),
          count: jest.fn().mockResolvedValue(0),
          findFirst: jest.fn().mockResolvedValue(null),
        },
        storageObject: { findFirst: jest.fn() },
        $transaction: jest.fn(),
      };
      const eventPublisher = { publish: jest.fn() };
      const auditService = { record: jest.fn() };

      const { DocumentRegistryService } =
        await import('../modules/communication/document-registry.service');
      const service = new DocumentRegistryService(
        prisma as never,
        eventPublisher as never,
        auditService,
      );

      await service.listDocuments('comp-docs', { page: 1, limit: 10 });

      expect(prisma.documentRegistry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ companyId: 'comp-docs' }),
        }),
      );
    });
  });

  describe('ExportOrchestrationService company isolation', () => {
    it('scopes export history to companyId', async () => {
      const prisma = {
        reportExport: {
          findMany: jest.fn().mockResolvedValue([]),
          count: jest.fn().mockResolvedValue(0),
          create: jest.fn(),
          update: jest.fn(),
        },
        $transaction: jest.fn(),
      };

      const { ExportOrchestrationService } =
        await import('../modules/reports/export-orchestration.service');
      const service = new ExportOrchestrationService(
        prisma as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
      );

      await service.getExportHistory('comp-export', 1, 10);

      expect(prisma.reportExport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ companyId: 'comp-export' }),
        }),
      );
      expect(prisma.reportExport.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ companyId: 'comp-export' }),
        }),
      );
    });
  });
});
