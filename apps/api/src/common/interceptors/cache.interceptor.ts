import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisService } from '../../config/redis.service';
import {
  NOCACHE_KEY,
  CACHE_INVALIDATE_EXTRA_KEY,
} from '../decorators/cache.decorators';
import { createHash } from 'crypto';

const EXCLUDED_PATHS = [
  '/auth/',
  '/uploads/',
  '/attendance/events',
  '/attendance/nonce',
  '/events/stream',
  '/notifications/stream',
  '/attendance/me/check-in',
  '/attendance/me/check-out',
  '/activity-logs/export',
  '/health',
];

const RESOURCE_TTL: Record<string, number> = {
  designations: 300,
  departments: 300,
  companies: 300,
  employees: 120,
  customers: 120,
  'construction-sites': 120,
  vendors: 120,
  materials: 120,
  brokers: 120,
  dealers: 120,
  incentives: 120,
  reports: 300,
};

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const path: string = request.path || '';

    // Global prefix is 'api/v1'; strip it so exclusion matching is prefix-agnostic.
    const normalizedPath = path.replace(/^\/api\/v1/, '');
    const pathToMatch = normalizedPath.startsWith('/api/')
      ? normalizedPath.replace(/^\/api/, '')
      : normalizedPath;

    if (EXCLUDED_PATHS.some((p) => pathToMatch.startsWith(p)))
      return next.handle();

    const noCache = this.reflector.get<boolean>(
      NOCACHE_KEY,
      context.getHandler(),
    );
    if (noCache) return next.handle();

    if (method === 'GET') return this.handleGet(request, next);
    if (['POST', 'PATCH', 'DELETE'].includes(method))
      return this.handleMutation(context, request, next);
    return next.handle();
  }

  private handleGet(request: any, next: CallHandler): Observable<unknown> {
    const key = this.buildCacheKey(request);

    return new Observable<unknown>((subscriber) => {
      this.redisService
        .get<unknown>(key)
        .then((cached) => {
          if (cached !== null) {
            subscriber.next(cached);
            subscriber.complete();
            return;
          }
          next.handle().subscribe({
            next: (data) => {
              const ttl = this.getTTL(request.path);
              this.redisService.set(key, data, ttl).catch(() => {});
              subscriber.next(data);
            },
            error: (err) => subscriber.error(err),
            complete: () => subscriber.complete(),
          });
        })
        .catch(() => {
          next.handle().subscribe({
            next: (data) => subscriber.next(data),
            error: (err) => subscriber.error(err),
            complete: () => subscriber.complete(),
          });
        });
    });
  }

  private handleMutation(
    context: ExecutionContext,
    request: any,
    next: CallHandler,
  ): Observable<unknown> {
    const extraResources =
      this.reflector.get<string[]>(
        CACHE_INVALIDATE_EXTRA_KEY,
        context.getHandler(),
      ) || [];
    const resource = this.inferResource(request.path);
    const companyId = request.user?.companyId;

    const analyticsTriggers = [
      'leads',
      'bookings',
      'properties',
      'site-visits',
      'customers',
      'commissions',
      'incentives',
    ];

    return next.handle().pipe(
      tap(() => {
        if (!companyId) return;
        this.redisService
          .delByPattern('cache:' + resource + ':' + companyId + ':*')
          .catch(() => {});
        for (const extra of extraResources) {
          this.redisService
            .delByPattern('cache:' + extra + ':' + companyId + ':*')
            .catch(() => {});
        }
        if (analyticsTriggers.includes(resource)) {
          this.redisService
            .delByPattern('analytics:*:' + companyId + ':*')
            .catch(() => {});
        }
      }),
    );
  }

  private buildCacheKey(request: any): string {
    const companyId = request.user?.companyId || 'global';
    const userId = request.user?.id || '';
    const path = request.path.replace(/^\/api/, '');
    const query = request.query
      ? JSON.stringify(request.query, Object.keys(request.query).sort())
      : '';
    const queryHash = query
      ? createHash('md5').update(query).digest('hex').slice(0, 8)
      : '';
    const resource = this.inferResource(request.path);
    return (
      'cache:' +
      resource +
      ':' +
      companyId +
      ':' +
      userId +
      ':' +
      path +
      ':' +
      queryHash
    );
  }

  private inferResource(path: string): string {
    const cleaned = path.replace(/^\/api\//, '');
    return cleaned.split('/')[0] || 'unknown';
  }

  private getTTL(path: string): number {
    const normalized = path.replace(/^\/api\/v1/, '');
    if (normalized.startsWith('reports/catalog')) return 300;
    const resource = this.inferResource(normalized);
    return RESOURCE_TTL[resource] ?? 60;
  }
}
