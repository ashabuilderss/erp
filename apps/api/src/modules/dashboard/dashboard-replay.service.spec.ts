describe('DashboardReplayService', () => {
  const mockPrisma = () => ({
    employee: { count: jest.fn().mockResolvedValue(10) },
    approvalRequest: { count: jest.fn().mockResolvedValue(3) },
    task: { count: jest.fn().mockResolvedValue(2) },
    warning: { count: jest.fn().mockResolvedValue(1) },
    payrollHold: { count: jest.fn().mockResolvedValue(0) },
    leaveRequest: { count: jest.fn().mockResolvedValue(2) },
    property: { count: jest.fn().mockResolvedValue(5) },
    lead: { count: jest.fn().mockResolvedValue(20) },
    siteVisit: { count: jest.fn().mockResolvedValue(8) },
    booking: {
      count: jest.fn().mockResolvedValue(4),
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 500000 } }),
    },
    dashboardAlert: { count: jest.fn().mockResolvedValue(1) },
    performanceScore: {
      aggregate: jest.fn().mockResolvedValue({ _avg: { compositeScore: 75 } }),
    },
    dashboardKpiSnapshot: {
      upsert: jest.fn().mockResolvedValue({ id: 'snap-1' }),
    },
  });

  it('counts all KPI dimensions for a company', async () => {
    const prisma = mockPrisma();
    const { DashboardReplayService } =
      await import('../dashboard/dashboard-replay.service');
    const service = new DashboardReplayService(prisma as never);

    const result = await service.rebuildSnapshot('comp-1', '2026-01-15');

    expect(result).toHaveProperty('id', 'snap-1');
    expect(prisma.employee.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 'comp-1' }),
      }),
    );
    expect(prisma.lead.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 'comp-1' }),
      }),
    );
  });

  it('upserts snapshot with correct company and date', async () => {
    const prisma = mockPrisma();
    const { DashboardReplayService } =
      await import('../dashboard/dashboard-replay.service');
    const service = new DashboardReplayService(prisma as never);

    await service.rebuildSnapshot('comp-2', '2026-06-01');

    expect(prisma.dashboardKpiSnapshot.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          companyId_snapshotDate: expect.objectContaining({
            companyId: 'comp-2',
          }),
        }),
      }),
    );
  });

  it('calculates conversion rate correctly', async () => {
    const prisma = mockPrisma();
    prisma.lead.count
      .mockResolvedValueOnce(100) // totalLeads
      .mockResolvedValueOnce(25); // convertedLeads
    const { DashboardReplayService } =
      await import('../dashboard/dashboard-replay.service');
    const service = new DashboardReplayService(prisma as never);

    await service.rebuildSnapshot('comp-1', '2026-01-15');

    const upsertCall = prisma.dashboardKpiSnapshot.upsert.mock.calls[0][0];
    expect(upsertCall.create.conversionRate).toBe(25);
  });

  it('handles zero leads (conversion rate = 0)', async () => {
    const prisma = mockPrisma();
    prisma.lead.count
      .mockResolvedValueOnce(0) // totalLeads
      .mockResolvedValueOnce(0); // convertedLeads
    const { DashboardReplayService } =
      await import('../dashboard/dashboard-replay.service');
    const service = new DashboardReplayService(prisma as never);

    await service.rebuildSnapshot('comp-1', '2026-01-15');

    const upsertCall = prisma.dashboardKpiSnapshot.upsert.mock.calls[0][0];
    expect(upsertCall.create.conversionRate).toBe(0);
  });

  it('includes revenue from confirmed bookings', async () => {
    const prisma = mockPrisma();
    prisma.booking.aggregate.mockResolvedValue({ _sum: { amount: 1234567 } });
    const { DashboardReplayService } =
      await import('../dashboard/dashboard-replay.service');
    const service = new DashboardReplayService(prisma as never);

    await service.rebuildSnapshot('comp-1', '2026-01-15');

    const upsertCall = prisma.dashboardKpiSnapshot.upsert.mock.calls[0][0];
    expect(upsertCall.create.totalRevenue).toBe(1234567);
  });

  it('defaults avgPerformanceScore to 0 when no scores exist', async () => {
    const prisma = mockPrisma();
    prisma.performanceScore.aggregate.mockResolvedValue({
      _avg: { compositeScore: null },
    });
    const { DashboardReplayService } =
      await import('../dashboard/dashboard-replay.service');
    const service = new DashboardReplayService(prisma as never);

    await service.rebuildSnapshot('comp-1', '2026-01-15');

    const upsertCall = prisma.dashboardKpiSnapshot.upsert.mock.calls[0][0];
    expect(upsertCall.create.avgPerformanceScore).toBe(0);
  });
});
