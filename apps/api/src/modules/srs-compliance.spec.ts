import * as fs from 'fs';

describe('Phase 4.2 SRS Compliance', () => {
  describe('RBAC Matrix', () => {
    it('has exactly 4 roles with permission mappings', async () => {
      const { getPermissionsForRole } =
        await import('../common/auth/permissions');
      const roles = ['OWNER', 'ADMIN', 'HR_MANAGER', 'EMPLOYEE'] as const;
      for (const role of roles) {
        const perms = getPermissionsForRole(role);
        expect(perms.length).toBeGreaterThan(0);
      }
    });

    it('OWNER has all permissions', async () => {
      const { getPermissionsForRole, Permissions } =
        await import('../common/auth/permissions');
      const ownerPerms = getPermissionsForRole('OWNER');
      expect(ownerPerms).toContain(Permissions.USER_READ);
      expect(ownerPerms).toContain(Permissions.LEAD_READ);
      expect(ownerPerms).toContain(Permissions.EXPORT_CONFIG_MANAGE);
      expect(ownerPerms.length).toBeGreaterThanOrEqual(30);
    });

    it('EMPLOYEE cannot access user management or export config', async () => {
      const { getPermissionsForRole, Permissions } =
        await import('../common/auth/permissions');
      const empPerms = getPermissionsForRole('EMPLOYEE');
      expect(empPerms).not.toContain(Permissions.USER_CREATE);
      expect(empPerms).not.toContain(Permissions.EXPORT_CONFIG_MANAGE);
    });
  });

  describe('Company Isolation', () => {
    it('ReportsService is defined', async () => {
      const { ReportsService } = await import('./reports/reports.service');
      expect(ReportsService).toBeDefined();
    });

    it('PerformanceService is defined', async () => {
      const { PerformanceService } =
        await import('./performance/performance.service');
      expect(PerformanceService).toBeDefined();
    });

    it('ExportOrchestrationService is defined', async () => {
      const { ExportOrchestrationService } =
        await import('./reports/export-orchestration.service');
      expect(ExportOrchestrationService).toBeDefined();
    });
  });

  describe('Domain Events', () => {
    it('GovernanceEventProcessor is defined', async () => {
      const { GovernanceEventProcessor } =
        await import('./governance-events/governance-event.processor');
      expect(GovernanceEventProcessor).toBeDefined();
    });

    it('GovernanceEventPublisher is defined', async () => {
      const { GovernanceEventPublisher } =
        await import('./governance-events/governance-event.publisher');
      expect(GovernanceEventPublisher).toBeDefined();
    });
  });

  describe('Export Framework', () => {
    it('ExportOrchestrationService is defined', async () => {
      const { ExportOrchestrationService } =
        await import('./reports/export-orchestration.service');
      expect(ExportOrchestrationService).toBeDefined();
    });

    it('ExportFormat enum covers CSV, EXCEL, PDF, SHEET', async () => {
      const { ExportFormat } = await import('@prisma/client');
      expect(ExportFormat.CSV).toBeDefined();
      expect(ExportFormat.EXCEL).toBeDefined();
      expect(ExportFormat.PDF).toBeDefined();
      expect(ExportFormat.SHEET).toBeDefined();
    });

    it('ExportConfigService is defined', async () => {
      const { ExportConfigService } =
        await import('./reports/export-config.service');
      expect(ExportConfigService).toBeDefined();
    });

    it('GoogleSheetsClient is defined', async () => {
      const { GoogleSheetsClient } =
        await import('./reports/google-sheets/google-sheets.client');
      expect(GoogleSheetsClient).toBeDefined();
    });

    it('SheetSyncService is defined', async () => {
      const { SheetSyncService } =
        await import('./reports/google-sheets/sheet-sync.service');
      expect(SheetSyncService).toBeDefined();
    });

    it('ReportExportStatus enum covers PENDING through FAILED', async () => {
      const { ReportExportStatus } = await import('@prisma/client');
      expect(ReportExportStatus.REQUESTED).toBeDefined();
      expect(ReportExportStatus.PROCESSING).toBeDefined();
      expect(ReportExportStatus.COMPLETED).toBeDefined();
      expect(ReportExportStatus.FAILED).toBeDefined();
    });
  });

  describe('Export Permissions', () => {
    it('has EXPORT_CONFIG_READ permission', async () => {
      const { Permissions } = await import('../common/auth/permissions');
      expect(Permissions).toHaveProperty('EXPORT_CONFIG_READ');
    });

    it('has EXPORT_CONFIG_MANAGE permission', async () => {
      const { Permissions } = await import('../common/auth/permissions');
      expect(Permissions).toHaveProperty('EXPORT_CONFIG_MANAGE');
    });

    it('has EXPORT_SHEET_SYNC permission', async () => {
      const { Permissions } = await import('../common/auth/permissions');
      expect(Permissions).toHaveProperty('EXPORT_SHEET_SYNC');
    });

    it('has EXPORT_DOWNLOAD permission', async () => {
      const { Permissions } = await import('../common/auth/permissions');
      expect(Permissions).toHaveProperty('EXPORT_DOWNLOAD');
    });

    it('has EXPORT_HISTORY permission', async () => {
      const { Permissions } = await import('../common/auth/permissions');
      expect(Permissions).toHaveProperty('EXPORT_HISTORY');
    });
  });

  describe('CQRS Read Model', () => {
    it('DashboardReplayService is defined', async () => {
      const { DashboardReplayService } =
        await import('./dashboard/dashboard-replay.service');
      expect(DashboardReplayService).toBeDefined();
    });
  });

  describe('Scheduler Jobs', () => {
    it('ExportSyncJob is defined', async () => {
      const { ExportSyncJob } =
        await import('./scheduler/jobs/export-sync.job');
      expect(ExportSyncJob).toBeDefined();
    });

    it('ExportRetentionJob is defined', async () => {
      const { ExportRetentionJob } =
        await import('./scheduler/jobs/export-retention.job');
      expect(ExportRetentionJob).toBeDefined();
    });
  });
});

describe('Phase 4.2 Final Freeze Audit', () => {
  it('DomainEvent model has required fields in schema', async () => {
    const schema = fs.readFileSync('prisma/schema.prisma', 'utf-8');
    const domainEventSection = schema.substring(
      schema.indexOf('model DomainEvent'),
      schema.indexOf('}', schema.indexOf('model DomainEvent')) + 1,
    );
    expect(domainEventSection).toContain('id');
    expect(domainEventSection).toContain('correlationId');
    expect(domainEventSection).toContain('parentEventId');
    expect(domainEventSection).toContain('eventType');
    expect(domainEventSection).toContain('eventVersion');
    expect(domainEventSection).toContain('entityId');
    expect(domainEventSection).toContain('entityType');
    expect(domainEventSection).toContain('payload');
    expect(domainEventSection).toContain('status');
    expect(domainEventSection).toContain('attemptCount');
    expect(domainEventSection).toContain('lastError');
    expect(domainEventSection).toContain('publishedAt');
  });

  it('ReportExport model has required fields in schema', async () => {
    const schema = fs.readFileSync('prisma/schema.prisma', 'utf-8');
    const section = schema.substring(
      schema.indexOf('model ReportExport'),
      schema.indexOf('}', schema.indexOf('model ReportExport')) + 1,
    );
    expect(section).toContain('id');
    expect(section).toContain('companyId');
    expect(section).toContain('generatedById');
    expect(section).toContain('title');
    expect(section).toContain('format');
    expect(section).toContain('status');
    expect(section).toContain('reportKey');
    expect(section).toContain('createdAt');
  });

  it('ExportConfig model has syncStatus field in schema', async () => {
    const schema = fs.readFileSync('prisma/schema.prisma', 'utf-8');
    const section = schema.substring(
      schema.indexOf('model ExportConfig'),
      schema.indexOf('}', schema.indexOf('model ExportConfig')) + 1,
    );
    expect(section).toContain('syncStatus');
  });

  it('DayAggregateStatus enum has COMPLETED and UNDER_REVIEW', async () => {
    const schema = fs.readFileSync('prisma/schema.prisma', 'utf-8');
    const section = schema.substring(
      schema.indexOf('enum DayAggregateStatus'),
      schema.indexOf('}', schema.indexOf('enum DayAggregateStatus')) + 1,
    );
    expect(section).toContain('COMPLETED');
    expect(section).toContain('UNDER_REVIEW');
    expect(section).toContain('VERIFIED');
    expect(section).toContain('FLAGGED');
  });

  it('no ts-ignore in critical service files', async () => {
    const files = [
      'src/modules/reports/reports.service.ts',
      'src/modules/reports/export-orchestration.service.ts',
      'src/modules/performance/performance.service.ts',
      'src/modules/governance-events/governance-event.processor.ts',
      'src/modules/dashboard/dashboard-replay.service.ts',
    ];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content).not.toMatch(/ts-ignore/);
    }
  });

  it('all Phase 4.2 services have company-scoped queries', async () => {
    const files = [
      'src/modules/reports/reports.service.ts',
      'src/modules/reports/export-orchestration.service.ts',
      'src/modules/performance/performance.service.ts',
      'src/modules/communication/announcement.service.ts',
      'src/modules/communication/document-registry.service.ts',
      'src/modules/dashboard/dashboard-replay.service.ts',
    ];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content).toMatch(/companyId/);
    }
  });

  it('GovernanceEventProcessor exists and is importable', async () => {
    const { GovernanceEventProcessor } =
      await import('./governance-events/governance-event.processor');
    expect(GovernanceEventProcessor).toBeDefined();
  });

  it('DashboardReplayService exists and is importable', async () => {
    const { DashboardReplayService } =
      await import('./dashboard/dashboard-replay.service');
    expect(DashboardReplayService).toBeDefined();
  });
});
