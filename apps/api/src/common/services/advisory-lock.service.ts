import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class AdvisoryLockService {
  private readonly logger = new Logger(AdvisoryLockService.name);

  constructor(private prisma: PrismaService) {}

  async tryLock(key: number): Promise<boolean> {
    try {
      const result = await this.prisma.$queryRawUnsafe<
        { pg_try_advisory_lock: boolean }[]
      >('SELECT pg_try_advisory_lock($1)', key);
      const acquired = result?.[0]?.pg_try_advisory_lock === true;
      if (acquired) {
        this.logger.debug(`Advisory lock acquired: ${key}`);
      }
      return acquired;
    } catch (err) {
      this.logger.error(`Failed to acquire advisory lock ${key}: ${err}`);
      return false;
    }
  }

  async unlock(key: number): Promise<void> {
    try {
      await this.prisma.$queryRawUnsafe('SELECT pg_advisory_unlock($1)', key);
      this.logger.debug(`Advisory lock released: ${key}`);
    } catch (err) {
      this.logger.error(`Failed to release advisory lock ${key}: ${err}`);
    }
  }

  async runWithLock<T>(key: number, fn: () => Promise<T>): Promise<T | null> {
    const acquired = await this.tryLock(key);
    if (!acquired) {
      this.logger.warn(`Could not acquire advisory lock ${key}, skipping`);
      return null;
    }
    try {
      return await fn();
    } finally {
      await this.unlock(key);
    }
  }
}
