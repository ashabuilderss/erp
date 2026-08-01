import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { REQUIRE_2FA_KEY } from '../decorators/require-2fa.decorator';

/**
 * §5.29: Two-factor authentication enforcement.
 *
 * When a route is annotated with `@Require2FA()`, privileged roles
 * (OWNER / ADMIN / ACCOUNTS) must have 2FA enrolled (`totpEnabled`).
 * Requests from privileged actors who have not enrolled in 2FA are rejected
 * with 403, guiding them to complete enrollment first.
 *
 * The check is opt-in (only runs where `@Require2FA()` is present) and is a
 * no-op for non-privileged actors and unauthenticated requests (auth is handled
 * by JwtAuthGuard), so it never breaks existing flows.
 */
const PRIVILEGED_ROLES: ReadonlyArray<UserRole> = [
  UserRole.OWNER,
  UserRole.ADMIN,
  UserRole.ACCOUNTS,
];

@Injectable()
export class TwoFactorEnforcedGuard implements CanActivate {
  private readonly logger = new Logger(TwoFactorEnforcedGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<boolean>(REQUIRE_2FA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: { id: string; role: string };
    }>();
    const user = request.user;
    if (!user?.id || !user?.role) {
      return true;
    }

    if (!PRIVILEGED_ROLES.includes(user.role as UserRole)) {
      return true;
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { totpEnabled: true, email: true },
    });

    if (!dbUser) {
      return true;
    }

    if (!dbUser.totpEnabled) {
      this.logger.warn(
        `2FA enforcement blocked privileged action for ${dbUser.email} (role=${user.role})`,
      );
      throw new ForbiddenException(
        'Two-factor authentication is required for this action. ' +
          'Please enroll in 2FA first via POST /api/auth/2fa/setup, then verify with /api/auth/2fa/verify.',
      );
    }

    return true;
  }
}
