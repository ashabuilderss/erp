import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IdempotencyService } from '../services/idempotency.service';
export declare class IdempotencyGuard implements CanActivate {
    private readonly reflector;
    private readonly idempotencyService;
    private readonly logger;
    constructor(reflector: Reflector, idempotencyService: IdempotencyService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private interceptResponse;
}
