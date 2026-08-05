import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../config/prisma.service';
import { RbacService } from '../rbac/rbac.service';
export declare class PermissionsGuard implements CanActivate {
    private reflector;
    private prisma;
    private rbacService;
    private eventEmitter;
    private readonly logger;
    constructor(reflector: Reflector, prisma: PrismaService, rbacService: RbacService, eventEmitter: EventEmitter2);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
