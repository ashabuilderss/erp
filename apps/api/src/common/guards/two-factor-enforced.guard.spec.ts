import { TwoFactorEnforcedGuard } from './two-factor-enforced.guard';
import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../config/prisma.service';

function mockContext(
  require2faMeta: boolean,
  user?: { id: string; role: string },
) {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(require2faMeta),
  } as unknown as Reflector;

  const request = { user };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as Parameters<TwoFactorEnforcedGuard['canActivate']>[0];

  return { reflector, context };
}

describe('TwoFactorEnforcedGuard', () => {
  beforeEach(() => jest.clearAllMocks());

  function buildGuard(
    reflector: Reflector,
    dbUser: { totpEnabled: boolean; email: string } | null,
  ) {
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(dbUser) },
    } as unknown as PrismaService;
    return new TwoFactorEnforcedGuard(reflector, prisma);
  }

  it('allows when @Require2FA() is not present', async () => {
    const { reflector, context } = mockContext(false, {
      id: 'u1',
      role: 'OWNER',
    });
    const guard = buildGuard(reflector, null);
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('rejects OWNER without 2FA enrolled', async () => {
    const { reflector, context } = mockContext(true, {
      id: 'u1',
      role: 'OWNER',
    });
    const guard = buildGuard(reflector, { totpEnabled: false, email: 'o@ex.com' });
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows OWNER with 2FA enrolled', async () => {
    const { reflector, context } = mockContext(true, {
      id: 'u1',
      role: 'OWNER',
    });
    const guard = buildGuard(reflector, { totpEnabled: true, email: 'o@ex.com' });
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('allows non-privileged EMPLOYEE even on @Require2FA() routes', async () => {
    const { reflector, context } = mockContext(true, {
      id: 'u2',
      role: 'EMPLOYEE',
    });
    const guard = buildGuard(reflector, { totpEnabled: false, email: 'e@ex.com' });
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('blocks ADMIN and ACCOUNTS without 2FA', async () => {
    for (const role of [UserRole.ADMIN, UserRole.ACCOUNTS]) {
      const { reflector, context } = mockContext(true, { id: 'u3', role });
      const guard = buildGuard(reflector, { totpEnabled: false, email: 'a@ex.com' });
      await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    }
  });
});
