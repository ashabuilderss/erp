import { RolesGuard } from './roles.guard';
import { UserRole } from '@prisma/client';
import { ExecutionContext } from '@nestjs/common';

describe('RolesGuard', () => {
  let guard: RolesGuard;

  const mockReflector = () => ({
    getAllAndOverride: jest.fn(),
  });

  const mockRequest = (role?: UserRole) => ({
    switchToHttp: () => ({
      getRequest: () => ({
        user: role
          ? {
              id: 'usr-1',
              email: 'test@test.com',
              firstName: 'Test',
              lastName: 'User',
              role,
            }
          : undefined,
      }),
    }),
  });

  const mockContext = (role?: UserRole) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          user: role
            ? {
                id: 'usr-1',
                email: 'test@test.com',
                firstName: 'Test',
                lastName: 'User',
                role,
              }
            : undefined,
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    guard = new RolesGuard(mockReflector() as never);
  });

  it('allows access when no roles are required', () => {
    const reflector = mockReflector();
    reflector.getAllAndOverride.mockReturnValue(null);
    guard = new RolesGuard(reflector as never);

    expect(guard.canActivate(mockContext(UserRole.EMPLOYEE))).toBe(true);
  });

  it('allows access when empty roles array', () => {
    const reflector = mockReflector();
    reflector.getAllAndOverride.mockReturnValue([]);
    guard = new RolesGuard(reflector as never);

    expect(guard.canActivate(mockContext(UserRole.EMPLOYEE))).toBe(true);
  });

  it('allows OWNER regardless of required roles', () => {
    const reflector = mockReflector();
    reflector.getAllAndOverride.mockReturnValue([UserRole.HR_MANAGER]);
    guard = new RolesGuard(reflector as never);

    expect(guard.canActivate(mockContext(UserRole.OWNER))).toBe(true);
  });

  it('allows matching role', () => {
    const reflector = mockReflector();
    reflector.getAllAndOverride.mockReturnValue([UserRole.HR_MANAGER]);
    guard = new RolesGuard(reflector as never);

    expect(guard.canActivate(mockContext(UserRole.HR_MANAGER))).toBe(true);
  });

  it('denies non-matching role', () => {
    const reflector = mockReflector();
    reflector.getAllAndOverride.mockReturnValue([UserRole.HR_MANAGER]);
    guard = new RolesGuard(reflector as never);

    expect(guard.canActivate(mockContext(UserRole.EMPLOYEE))).toBe(false);
  });

  it('denies access when user is undefined', () => {
    const reflector = mockReflector();
    reflector.getAllAndOverride.mockReturnValue([UserRole.EMPLOYEE]);
    guard = new RolesGuard(reflector as never);

    expect(guard.canActivate(mockContext(undefined))).toBe(false);
  });
});
