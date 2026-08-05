import { PrismaService } from '../../config/prisma.service';
import { RedisService } from '../../config/redis.service';
import { PermissionScope, UserRole } from '@prisma/client';
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
export declare class RbacService {
    private readonly prisma;
    private readonly redis;
    private readonly logger;
    constructor(prisma: PrismaService, redis: RedisService);
    checkPermission(user: RbacUserContext, permissionAction: string): Promise<RbacResult>;
    private compileUserMatrix;
    invalidateMatrix(userId: string, companyId: string): Promise<void>;
}
