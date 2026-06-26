import { AuthService } from './auth.service';

describe('AuthService effective permissions', () => {
  it('merges role defaults with per-user grants', async () => {
    const prisma = {
      permissionGrant: {
        findMany: jest.fn().mockResolvedValue([
          { permission: 'lead:read', granted: false },
          { permission: 'booking:update', granted: true },
        ]),
      },
    };
    const service = new AuthService(prisma as never, {} as never, {} as never, {} as never, {} as never);
    const result = await service.getEffectivePermissions('user-1', 'EMPLOYEE' as never);
    expect(result).not.toContain('lead:read');
    expect(result).toContain('booking:update');
  });
});
