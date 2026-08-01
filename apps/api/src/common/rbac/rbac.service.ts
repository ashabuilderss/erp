import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { RedisService } from '../../config/redis.service';
import { PermissionScope, UserRole, PermissionEffect } from '@prisma/client';

export type RbacEffect = 'ALLOW' | 'DENY';

export interface RbacResult {
  effect: RbacEffect;
  scope?: PermissionScope;
}

export interface RbacUserContext {
  id: string;
  companyId: string;
  role: UserRole;
}

@Injectable()
export class RbacService {
  private readonly logger = new Logger(RbacService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Checks if a user has access to a specific permission action.
   * Leverages a fully compiled matrix stored in Redis to guarantee zero DB hits on cache hits.
   */
  async checkPermission(
    user: RbacUserContext,
    permissionAction: string,
  ): Promise<RbacResult> {
    // 1. Static Owner Bypass (Zero DB hit, zero Cache hit needed)
    if (user.role === UserRole.OWNER) {
      return { effect: 'ALLOW', scope: PermissionScope.OWNER_ONLY };
    }

    const cacheKey = `rbac:company:${user.companyId}:user:${user.id}:matrix`;

    // 2. Fetch Compiled Matrix from Cache
    let matrix = await this.redis.get<Record<string, RbacResult>>(cacheKey);

    if (!matrix) {
      // 3. Compile Matrix on Cache Miss
      matrix = await this.compileUserMatrix(user.id, user.companyId);
      // Cache the matrix for 1 hour
      await this.redis.set(cacheKey, matrix, 3600);
    }

    // 4. Resolve specific permission from matrix
    const result = matrix[permissionAction];

    // 5. Fail closed if not present in the matrix
    if (!result) {
      return { effect: 'DENY' };
    }

    return result;
  }

  /**
   * Compiles the full permission matrix for a user by combining Role and User permissions.
   * Respects the precedence: Dynamic Owner > UserPermission (DENY) > UserPermission (ALLOW) > RolePermission.
   */
  private async compileUserMatrix(
    userId: string,
    companyId: string,
  ): Promise<Record<string, RbacResult>> {
    const matrix: Record<string, RbacResult> = {};

    // Fetch the user's base information and dynamic role
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });

    if (!user || user.companyId !== companyId) {
      return matrix;
    }

    // Precedence 1: Dynamic Owner Bypass
    if (user.roles?.name?.toUpperCase() === 'OWNER') {
      const allPermissions = await this.prisma.permission.findMany();
      for (const perm of allPermissions) {
        matrix[perm.action] = {
          effect: 'ALLOW',
          scope: PermissionScope.OWNER_ONLY,
        };
      }
      return matrix;
    }

    // Precedence 2: Role Permissions (Base foundation)
    if (user.roleId) {
      const rolePermissions = await this.prisma.rolePermission.findMany({
        where: { roleId: user.roleId },
        include: { permissions: true },
      });
      for (const rp of rolePermissions) {
        matrix[rp.permissions.action] = { effect: 'ALLOW', scope: rp.scope };
      }
    }

    // Precedence 3 & 4: UserPermissions (Explicit ALLOW / DENY Overrides)
    const userPermissions = await this.prisma.userPermission.findMany({
      where: { userId },
      include: { permissions: true },
    });

    for (const up of userPermissions) {
      if (up.effect === PermissionEffect.DENY) {
        // Explicit DENY overrides any Role ALLOW
        matrix[up.permissions.action] = { effect: 'DENY' };
      } else if (up.effect === PermissionEffect.ALLOW) {
        // Explicit ALLOW overrides Role ALLOW (potentially expanding/shrinking scope)
        matrix[up.permissions.action] = { effect: 'ALLOW', scope: up.scope };
      }
    }

    return matrix;
  }

  /**
   * Invalidates the compiled matrix for a specific user.
   * Call this whenever a RolePermission or UserPermission is updated.
   */
  async invalidateMatrix(userId: string, companyId: string): Promise<void> {
    const cacheKey = `rbac:company:${companyId}:user:${userId}:matrix`;
    await this.redis.del(cacheKey);
  }
}
