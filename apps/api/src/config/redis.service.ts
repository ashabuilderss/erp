import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null;
  private readonly logger = new Logger(RedisService.name);
  private enabled = false;

  async onModuleInit() {
    const url = process.env.REDIS_URL;
    if (!url) {
      this.logger.warn('REDIS_URL not set, caching disabled');
      return;
    }
    try {
      this.client = new Redis(url, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          if (times > 5) return null;
          return Math.min(times * 200, 2000);
        },
        lazyConnect: true,
      });
      await this.client.connect();
      this.enabled = true;
      this.logger.log('Connected to Redis');
    } catch (err) {
      this.logger.warn('Redis connection failed, caching disabled', err);
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled || !this.client) return null;
    try {
      const raw = await this.client.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttl = 60): Promise<void> {
    if (!this.enabled || !this.client) return;
    try {
      const serialized = JSON.stringify(value);
      await this.client.setex(key, ttl, serialized);
    } catch (err) {
      this.logger.warn('Redis set failed for ' + key, err);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.enabled || !this.client) return;
    try {
      await this.client.del(key);
    } catch (err) {
      this.logger.warn('Redis del failed for ' + key, err);
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    if (!this.enabled || !this.client) return;
    try {
      let cursor = '0';
      do {
        const result = await this.client.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );
        cursor = result[0];
        const keys = result[1];
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } while (cursor !== '0');
    } catch (err) {
      this.logger.warn('Redis delByPattern failed for ' + pattern, err);
    }
  }
}
