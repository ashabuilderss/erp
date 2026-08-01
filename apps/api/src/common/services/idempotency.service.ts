import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../config/redis.service';
import { randomBytes } from 'crypto';

export interface IdempotencyResult {
  /** Whether this key was already processed */
  isReplay: boolean;
  /** Stored response body (only when isReplay is true) */
  responseBody?: unknown;
  /** Stored HTTP status code (only when isReplay is true) */
  statusCode?: number;
  /** A new idempotency key to use when the client didn't send one */
  generatedKey?: string;
}

const DEFAULT_TTL_SECONDS = 86400; // 24 hours

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);

  constructor(private readonly redis: RedisService) {}

  /**
   * Generate a cryptographically random idempotency key.
   */
  generateKey(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * Build the Redis key used to store an idempotency record.
   */
  private buildRedisKey(idempotencyKey: string, companyId: string): string {
    return `idempotency:${companyId}:${idempotencyKey}`;
  }

  /**
   * Try to acquire the idempotency lock for a given key.
   *
   * Returns:
   *  - { status: 'new' }        → caller should proceed with the request
   *  - { status: 'in_progress' } → another request is still processing; caller should wait/retry
   *  - { status: 'completed', body, statusCode } → replay; return the stored response
   *  - { status: 'error', body, statusCode }     → the original request errored; replay the error
   */
  async check(
    idempotencyKey: string,
    companyId: string,
  ): Promise<
    | { status: 'new' }
    | { status: 'in_progress' }
    | { status: 'completed'; body: unknown; statusCode: number }
    | { status: 'error'; body: unknown; statusCode: number }
  > {
    const redisKey = this.buildRedisKey(idempotencyKey, companyId);
    const raw = await this.redis.get<{
      status: 'in_progress' | 'completed' | 'error';
      body?: unknown;
      statusCode?: number;
    }>(redisKey);

    if (!raw) {
      return { status: 'new' };
    }

    if (raw.status === 'in_progress') {
      return { status: 'in_progress' };
    }

    return raw as
      | { status: 'completed'; body: unknown; statusCode: number }
      | { status: 'error'; body: unknown; statusCode: number };
  }

  /**
   * Mark the key as in_progress while the request is being processed.
   */
  async markInProgress(
    idempotencyKey: string,
    companyId: string,
  ): Promise<void> {
    const redisKey = this.buildRedisKey(idempotencyKey, companyId);
    await this.redis.set(
      redisKey,
      { status: 'in_progress' },
      DEFAULT_TTL_SECONDS,
    );
  }

  /**
   * Store the successful result of an idempotent operation.
   */
  async markCompleted(
    idempotencyKey: string,
    companyId: string,
    body: unknown,
    statusCode: number,
  ): Promise<void> {
    const redisKey = this.buildRedisKey(idempotencyKey, companyId);
    await this.redis.set(
      redisKey,
      { status: 'completed', body, statusCode },
      DEFAULT_TTL_SECONDS,
    );
  }

  /**
   * Store the error result of a failed idempotent operation.
   */
  async markError(
    idempotencyKey: string,
    companyId: string,
    body: unknown,
    statusCode: number,
  ): Promise<void> {
    const redisKey = this.buildRedisKey(idempotencyKey, companyId);
    await this.redis.set(
      redisKey,
      { status: 'error', body, statusCode },
      DEFAULT_TTL_SECONDS,
    );
  }
}
