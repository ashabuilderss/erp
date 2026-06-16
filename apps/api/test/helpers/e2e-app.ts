import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import { LoggerService } from '../../src/common/logger/logger.service';
import { PrismaService } from '../../src/config/prisma.service';

export interface E2eContext {
  app: INestApplication;
  prisma: PrismaService;
}

export async function createE2eApp(): Promise<E2eContext> {
  process.env.AUTH_SECRET =
    process.env.AUTH_SECRET ||
    'test-secret-that-is-long-enough-for-jwt-signing';
  process.env.FRONTEND_URL =
    process.env.FRONTEND_URL || 'http://localhost:3000';

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  const logger = app.get(LoggerService);
  app.useLogger(logger);
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();

  return {
    app,
    prisma: app.get(PrismaService),
  };
}
