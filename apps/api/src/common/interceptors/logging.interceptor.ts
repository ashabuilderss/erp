import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { LoggerService } from '../logger/logger.service';

const SENSITIVE_FIELDS = new Set([
  'password',
  'hashedPassword',
  'confirmPassword',
  'currentPassword',
  'newPassword',
  'token',
  'authorization',
  'secret',
  'totpSecret',
  'backupCodes',
  'encryptionKey',
  'authSecret',
  'postgresPassword',
  'redisPassword',
  'otp',
  'totp',
  'nonce',
]);

const SENSITIVE_URL_PATTERNS = /password|token|secret|otp|totp|nonce/i;

function sanitizeData(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeData);

  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_FIELDS.has(key)) {
      cleaned[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      cleaned[key] = sanitizeData(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

function sanitizeUrl(url: string): string {
  if (!SENSITIVE_URL_PATTERNS.test(url)) return url;
  try {
    const parsed = new URL(url, 'http://localhost');
    const params = parsed.searchParams;
    for (const [key] of params) {
      if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
        params.set(key, '[REDACTED]');
      }
    }
    return url.includes('?') ? `${parsed.pathname}${parsed.search}` : url;
  } catch {
    return url;
  }
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const sanitizedUrl = sanitizeUrl(url);
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const duration = Date.now() - start;
          this.logger.requestLog(method, sanitizedUrl, response.statusCode, duration);
        },
        error: (error: any) => {
          const duration = Date.now() - start;
          this.logger.requestLog(method, sanitizedUrl, error.status || 500, duration);
          const safeMessage = sanitizeData(error.message || 'Unknown error');
          this.logger.error(
            `${method} ${sanitizedUrl} - ${safeMessage}`,
            error.stack,
            'HTTP',
          );
        },
      }),
    );
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
  }
}
