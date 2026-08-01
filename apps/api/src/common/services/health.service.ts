import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { RedisService } from '../../config/redis.service';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async check(): Promise<{
    status: string;
    timestamp: string;
    uptime: number;
    database: { status: string; latencyMs?: number };
    redis: { status: string; latencyMs?: number };
    smtp: { configured: boolean };
    fcm: { configured: boolean };
  }> {
    const dbStart = Date.now();
    let dbStatus = 'ok';
    let dbLatency: number | undefined;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - dbStart;
    } catch {
      dbStatus = 'error';
    }

    const redisStart = Date.now();
    let redisStatus = 'skipped';
    let redisLatency: number | undefined;
    try {
      await (this.redis as any).get('health:ping');
      redisLatency = Date.now() - redisStart;
      redisStatus = 'ok';
    } catch {
      redisStatus = 'error';
    }

    const smtpConfigured = !!(
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    );
    const fcmConfigured = !!(
      process.env.FCM_CREDENTIALS_PATH || process.env.FCM_SERVER_KEY
    );

    const overallStatus =
      dbStatus === 'ok' && redisStatus !== 'error' ? 'ok' : 'degraded';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: { status: dbStatus, latencyMs: dbLatency },
      redis: { status: redisStatus, latencyMs: redisLatency },
      smtp: { configured: smtpConfigured },
      fcm: { configured: fcmConfigured },
    };
  }
}
