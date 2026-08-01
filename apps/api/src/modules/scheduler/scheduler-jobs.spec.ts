describe('ExportSyncJob', () => {
  const mockLockService = () => ({
    runWithLock: jest
      .fn()
      .mockImplementation((_key: number, fn: () => Promise<void>) => fn()),
  });

  const mockSyncService = () => ({
    syncAllEnabled: jest.fn().mockResolvedValue([]),
  });

  it('acquires advisory lock before syncing', async () => {
    const lockService = mockLockService();
    const syncService = mockSyncService();

    const { ExportSyncJob } = await import('./jobs/export-sync.job');
    const job = new ExportSyncJob(lockService as never, syncService as never);

    await job.handle();

    expect(lockService.runWithLock).toHaveBeenCalledWith(
      20260708,
      expect.any(Function),
    );
  });

  it('calls syncAllEnabled inside lock', async () => {
    const lockService = mockLockService();
    const syncService = mockSyncService();

    const { ExportSyncJob } = await import('./jobs/export-sync.job');
    const job = new ExportSyncJob(lockService as never, syncService as never);

    await job.handle();

    expect(syncService.syncAllEnabled).toHaveBeenCalled();
  });

  it('handles mixed completed and failed results', async () => {
    const lockService = mockLockService();
    const syncService = mockSyncService();
    syncService.syncAllEnabled.mockResolvedValue([
      { status: 'COMPLETED', configId: 'cfg-1' },
      { status: 'FAILED', configId: 'cfg-2' },
      { status: 'COMPLETED', configId: 'cfg-3' },
    ]);

    const { ExportSyncJob } = await import('./jobs/export-sync.job');
    const job = new ExportSyncJob(lockService as never, syncService as never);

    await expect(job.handle()).resolves.not.toThrow();
  });

  it('handles empty results', async () => {
    const lockService = mockLockService();
    const syncService = mockSyncService();
    syncService.syncAllEnabled.mockResolvedValue([]);

    const { ExportSyncJob } = await import('./jobs/export-sync.job');
    const job = new ExportSyncJob(lockService as never, syncService as never);

    await expect(job.handle()).resolves.not.toThrow();
  });
});

describe('ExportRetentionJob', () => {
  const mockPrisma = () => ({
    reportExport: {
      deleteMany: jest.fn().mockResolvedValue({ count: 5 }),
    },
  });

  it('deletes ReportExport records older than 90 days', async () => {
    const prisma = mockPrisma();
    const { ExportRetentionJob } = await import('./jobs/export-retention.job');
    const job = new ExportRetentionJob(prisma as never);

    await job.handle();

    expect(prisma.reportExport.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: ['COMPLETED', 'FAILED'] },
        }),
      }),
    );
  });

  it('passes 90-day cutoff and COMPLETED/FAILED filter to deleteMany', async () => {
    const prisma = mockPrisma();
    const { ExportRetentionJob } = await import('./jobs/export-retention.job');
    const job = new ExportRetentionJob(prisma as never);

    await job.handle();

    const deleteCall = prisma.reportExport.deleteMany.mock.calls[0][0];
    const cutoff = deleteCall.where.createdAt.lt;
    expect(cutoff).toBeInstanceOf(Date);
    const expected = new Date();
    expected.setDate(expected.getDate() - 90);
    expect(cutoff.getFullYear()).toBe(expected.getFullYear());
    expect(deleteCall.where.status.in).toEqual(['COMPLETED', 'FAILED']);
  });

  it('does not delete PENDING or PROCESSING records', async () => {
    const prisma = mockPrisma();
    const { ExportRetentionJob } = await import('./jobs/export-retention.job');
    const job = new ExportRetentionJob(prisma as never);

    await job.handle();

    const deleteCall = prisma.reportExport.deleteMany.mock.calls[0][0];
    expect(deleteCall.where.status.in).toEqual(['COMPLETED', 'FAILED']);
    expect(deleteCall.where.status.in).not.toContain('PENDING');
    expect(deleteCall.where.status.in).not.toContain('PROCESSING');
  });
});
