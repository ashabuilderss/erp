import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  SetMetadata,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';

export const CACHE_TTL_KEY = 'cache_ttl';
export const CacheTTL = (ttl: number) => SetMetadata(CACHE_TTL_KEY, ttl);

@Injectable()
export class CacheControlInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
    const response = context.switchToHttp().getResponse();
    const request = context.switchToHttp().getRequest();

    const ttl = this.reflector.get<number | undefined>(
      CACHE_TTL_KEY,
      context.getHandler(),
    );

    return next.handle().pipe(
      tap(() => {
        if (request.method === 'GET' && ttl) {
          response.setHeader(
            'Cache-Control',
            `public, max-age=${ttl}, stale-while-revalidate=${ttl * 2}`,
          );
        } else if (request.method === 'GET') {
          response.setHeader('Cache-Control', 'no-cache, private');
        } else {
          response.setHeader('Cache-Control', 'no-store');
        }
      }),
    );
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
  }
}
