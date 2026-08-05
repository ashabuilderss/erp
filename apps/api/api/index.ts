import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { LoggerService } from '../src/common/logger/logger.service';
import { HealthService } from '../src/common/services/health.service';
import { PrismaExceptionFilter } from '../src/common/filters/prisma-exception.filter';
import { IdempotencyGuard } from '../src/common/guards/idempotency.guard';
import { IdempotencyService } from '../src/common/services/idempotency.service';
import { Express } from 'express';

let cachedServer: Express;

function validateEnv(): void {
  const required = ['DATABASE_URL', 'AUTH_SECRET'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `FATAL: Missing required environment variables: ${missing.join(', ')}`,
    );
  }
}

async function bootstrapServer(): Promise<Express> {
  if (!cachedServer) {
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
      }),
    );
    app.use(cookieParser());
    app.enableCors({
      origin: process.env.FRONTEND_URL || '*',
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

    const healthService = app.get(HealthService);
    const healthHandler = async (_req: any, res: any) => {
      const result = await healthService.check();
      const statusCode = result.status === 'ok' ? 200 : 503;
      res.status(statusCode).json(result);
    };
    app.getHttpAdapter().get('/api/health', healthHandler);
    app.getHttpAdapter().get('/api/v1/health', healthHandler);

    await app.init();
    cachedServer = app.getHttpAdapter().getInstance() as Express;
  }
  return cachedServer;
}

export default async function handler(req: any, res: any) {
  const server = await bootstrapServer();
  return server(req, res);
}
