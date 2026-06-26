import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import {
  Permission,
  getPermissionsForRole,
  mergePermissionsWithGrants,
} from '../auth/permissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
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
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

    if (role === UserRole.OWNER) return true;

    const rolePermissions = getPermissionsForRole(role);

    if (!userId) {
      const hasAll = requiredPermissions.every((p) =>
        rolePermissions.includes(p),
      );
      if (!hasAll) {
        throw new ForbiddenException(
          `Missing required permissions: ${requiredPermissions.join(', ')}`,
        );
      }
      return true;
    }

    const grants = await this.prisma.permissionGrant.findMany({
      where: { userId },
      select: { permission: true, granted: true },
    });

    const effectivePermissions = mergePermissionsWithGrants(
      rolePermissions,
      grants,
    );
    const hasAll = requiredPermissions.every((p) =>
      effectivePermissions.includes(p),
    );

    if (!hasAll) {
      throw new ForbiddenException(
        `Missing required permissions: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
