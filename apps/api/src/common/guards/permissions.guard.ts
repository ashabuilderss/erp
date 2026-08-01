import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import {
  Permission,
  getPermissionsForRole,
  mergePermissionsWithGrants,
} from '../auth/permissions';
import { RbacService, RbacUserContext } from '../rbac/rbac.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
    private rbacService: RbacService,
    private eventEmitter: EventEmitter2,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
    const request = context.switchToHttp().getRequest();
    const role: UserRole = request.user?.role;
    const userId: string | undefined = request.user?.id;
    const companyId: string | undefined = request.user?.companyId;
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

    if (!userId || !companyId) {
      // Legacy bypass for OWNER if userId/companyId isn't fully set but role is
      if (role === UserRole.OWNER) return true;
      throw new ForbiddenException(
        'Missing user context for permissions check',
      );
    }

    const userContext: RbacUserContext = { id: userId, companyId, role };

    const useLegacy = process.env.USE_LEGACY_RBAC !== 'false';

    // 1. Evaluate Legacy Rules
    let legacyAllowed = false;
    if (role === UserRole.OWNER) {
      legacyAllowed = true;
    } else {
      const rolePermissions = getPermissionsForRole(role);
      const grants = await this.prisma.permissionGrant.findMany({
        where: { userId },
        select: { permission: true, granted: true },
      });
      const effectivePermissions = mergePermissionsWithGrants(
        rolePermissions,
        grants,
      );
      legacyAllowed = requiredPermissions.every((p) =>
        effectivePermissions.includes(p),
      );
    }

    // 2. Evaluate New RBAC Rules
    let rbacAllowed = true;
    const scopes: Record<string, string> = {};

    for (const perm of requiredPermissions) {
      const result = await this.rbacService.checkPermission(userContext, perm);
      if (result.effect !== 'ALLOW') {
        rbacAllowed = false;
      }
      if (result.scope) {
        scopes[perm] = result.scope;
      }
    }

    // 3. Shadow Mode Logging
    if (useLegacy && legacyAllowed !== rbacAllowed) {
      this.logger.warn(
        `Shadow Mode Anomaly: Legacy allowed=${legacyAllowed}, RbacService allowed=${rbacAllowed} for user ${userId} on ${requiredPermissions.join(', ')}`,
      );
    }

    // 4. Enforce Policy
    const isAllowed = useLegacy ? legacyAllowed : rbacAllowed;

    if (!isAllowed) {
      if (requiredPermissions.some(p => p.startsWith('quotation:'))) {
        this.eventEmitter.emit('security.unauthorized', {
          userId: userId,
          companyId: companyId,
          path: request.url,
          method: request.method,
        });
      }
      throw new ForbiddenException(
        'Insufficient permissions',
      );
    }

    // 5. Attach scopes for downstream use
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    request.user.scopes = scopes;

    return true;
  }
}
