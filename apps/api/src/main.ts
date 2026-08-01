import * as Sentry from '@sentry/node';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { LoggerService } from './common/logger/logger.service';
import { HealthService } from './common/services/health.service';
import { IdempotencyGuard } from './common/guards/idempotency.guard';
import { IdempotencyService } from './common/services/idempotency.service';
import { Reflector } from '@nestjs/core';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { Express, Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';

function validateEnv(): void {
  const required = ['DATABASE_URL', 'AUTH_SECRET'];
  if (process.env.STORAGE_DRIVER === 's3') {
    required.push('S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'S3_BUCKET');
  }
  required.push('FRONTEND_URL');
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `FATAL: Missing required environment variables: ${missing.join(', ')}`,
    );
  }
}

Sentry.init({
  dsn: process.env.SENTRY_DSN || '',
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 0.1,
  enabled: !!process.env.SENTRY_DSN,
});

async function bootstrap() {
  validateEnv();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  const logger = app.get(LoggerService);
  app.useLogger(logger);

  app.setGlobalPrefix('api/v1');
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: [
            "'self'",
            'data:',
            'blob:',
            `${process.env.FRONTEND_URL || 'http://localhost:3000'}`,
          ],
          connectSrc: [
            "'self'",
            process.env.FRONTEND_URL || 'http://localhost:3000',
          ],
          fontSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
    }),
  );
  app.use(cookieParser());

  if (process.env.STORAGE_DRIVER !== 's3') {
    const uploadsDir = join(process.cwd(), 'uploads');
    const authSecret = process.env.AUTH_SECRET || '';

    app.use('/uploads', (req: Request, res: Response, next: NextFunction) => {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      const token = authHeader.slice(7);
      try {
        verify(token, authSecret);
        next();
      } catch {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
    });
    app.useStaticAssets(uploadsDir, { prefix: '/uploads' });
  }
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new PrismaExceptionFilter());

  const reflector = app.get(Reflector);
  const idempotencyService = app.get(IdempotencyService);
  app.useGlobalGuards(new IdempotencyGuard(reflector, idempotencyService));

  const port = process.env.PORT || 4000;

  const healthService = app.get(HealthService);
  const healthHandler = async (_req: any, res: any) => {
    const result = await healthService.check();
    const statusCode = result.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(result);
  };
  app.getHttpAdapter().get('/api/health', healthHandler);
  app.getHttpAdapter().get('/api/v1/health', healthHandler);

  if (process.env.NODE_ENV === 'production') {
    const smtpConfigured = !!(
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    );
    const fcmConfigured = !!(
      process.env.FCM_CREDENTIALS_PATH || process.env.FCM_SERVER_KEY
    );
    if (!smtpConfigured)
      logger.warn('SMTP not configured — email notifications will be disabled');
    if (!fcmConfigured)
      logger.warn('FCM not configured — push notifications will be disabled');
  }

  await app.listen(port);
  app.enableShutdownHooks();
  logger.log(`Backend running on http://localhost:${port}`);
  // Restart triggered
}
void bootstrap();
