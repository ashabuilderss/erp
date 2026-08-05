import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../config/prisma.service';
export declare class TwoFactorEnforcedGuard implements CanActivate {
    private readonly reflector;
    private readonly prisma;
    private readonly logger;
    constructor(reflector: Reflector, prisma: PrismaService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
