import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { RedisService } from '../../config/redis.service';
export declare class CacheInterceptor implements NestInterceptor {
    private readonly redisService;
    private readonly reflector;
    private readonly logger;
    constructor(redisService: RedisService, reflector: Reflector);
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
    private handleGet;
    private handleMutation;
    private buildCacheKey;
    private inferResource;
    private getTTL;
}
