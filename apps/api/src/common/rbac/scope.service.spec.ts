import { PermissionScope } from '@prisma/client';
import { ScopeService } from './scope.service';

describe('ScopeService', () => {
  let service: ScopeService;

  beforeEach(() => {
    service = new ScopeService();
  });

  describe('generateFilter', () => {
    const user = {
      id: 'usr-1',
      companyId: 'comp-1',
      teamId: 'team-1',
      departmentId: 'dept-1',
    };

    describe('OWN scope', () => {
      it('returns filter with createdById and companyId', () => {
        const filter = service.generateFilter(PermissionScope.OWN, user);
        expect(filter).toEqual({
          createdById: 'usr-1',
          companyId: 'comp-1',
        });
      });

      it('uses custom ownerField when provided', () => {
        const filter = service.generateFilter(
          PermissionScope.OWN,
          user,
          'assignedToEmployeeId',
        );
        expect(filter).toEqual({
          assignedToEmployeeId: 'usr-1',
          companyId: 'comp-1',
        });
      });
    });

    describe('TEAM scope', () => {
      it('returns filter with teamId and companyId when user has team', () => {
        const filter = service.generateFilter(PermissionScope.TEAM, user);
        expect(filter).toEqual({
          teamId: 'team-1',
          companyId: 'comp-1',
        });
      });

      it('falls back to OWN scope when user has no team', () => {
        const userNoTeam = { ...user, teamId: null };
        const filter = service.generateFilter(PermissionScope.TEAM, userNoTeam);
        expect(filter).toEqual({
          createdById: 'usr-1',
          companyId: 'comp-1',
        });
      });

      it('falls back to OWN scope when teamId is undefined', () => {
        const userUndefinedTeam = { ...user, teamId: undefined };
        const filter = service.generateFilter(
          PermissionScope.TEAM,
          userUndefinedTeam,
        );
        expect(filter).toEqual({
          createdById: 'usr-1',
          companyId: 'comp-1',
        });
      });
    });

    describe('DEPARTMENT scope', () => {
      it('returns filter with departmentId and companyId when user has department', () => {
        const filter = service.generateFilter(PermissionScope.DEPARTMENT, user);
        expect(filter).toEqual({
          departmentId: 'dept-1',
          companyId: 'comp-1',
        });
      });

      it('falls back to OWN scope when user has no department', () => {
        const userNoDept = { ...user, departmentId: null };
        const filter = service.generateFilter(
          PermissionScope.DEPARTMENT,
          userNoDept,
        );
        expect(filter).toEqual({
          createdById: 'usr-1',
          companyId: 'comp-1',
        });
      });
    });

    describe('COMPANY scope', () => {
      it('returns filter with only companyId', () => {
        const filter = service.generateFilter(PermissionScope.COMPANY, user);
        expect(filter).toEqual({ companyId: 'comp-1' });
      });
    });

    describe('OWNER_ONLY scope', () => {
      it('returns filter with only companyId (same as COMPANY)', () => {
        const filter = service.generateFilter(PermissionScope.OWNER_ONLY, user);
        expect(filter).toEqual({ companyId: 'comp-1' });
      });
    });

    describe('default fallback', () => {
      it('falls back to OWN scope for unknown scope', () => {
        const filter = service.generateFilter(
          'UNKNOWN' as PermissionScope,
          user,
        );
        expect(filter).toEqual({
          createdById: 'usr-1',
          companyId: 'comp-1',
        });
      });
    });

    describe('company isolation', () => {
      it('always includes companyId in every scope', () => {
        const scopes = [
          PermissionScope.OWN,
          PermissionScope.TEAM,
          PermissionScope.DEPARTMENT,
          PermissionScope.COMPANY,
          PermissionScope.OWNER_ONLY,
        ];

        for (const scope of scopes) {
          const filter = service.generateFilter(scope, user);
          expect(filter).toHaveProperty('companyId', 'comp-1');
        }
      });
    });
  });
});
