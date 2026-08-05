"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Sentry = __importStar(require("@sentry/node"));
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const path_1 = require("path");
const app_module_1 = require("./app.module");
const logger_service_1 = require("./common/logger/logger.service");
const health_service_1 = require("./common/services/health.service");
const idempotency_guard_1 = require("./common/guards/idempotency.guard");
const idempotency_service_1 = require("./common/services/idempotency.service");
const core_2 = require("@nestjs/core");
const prisma_exception_filter_1 = require("./common/filters/prisma-exception.filter");
const jsonwebtoken_1 = require("jsonwebtoken");
function validateEnv() {
    const required = ['DATABASE_URL', 'AUTH_SECRET'];
    if (process.env.STORAGE_DRIVER === 's3') {
        required.push('S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'S3_BUCKET');
    }
    required.push('FRONTEND_URL');
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`FATAL: Missing required environment variables: ${missing.join(', ')}`);
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
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        rawBody: true,
    });
    const logger = app.get(logger_service_1.LoggerService);
    app.useLogger(logger);
    app.setGlobalPrefix('api/v1');
    app.use((0, helmet_1.default)({
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
    }));
    app.use((0, cookie_parser_1.default)());
    if (process.env.STORAGE_DRIVER !== 's3') {
        const uploadsDir = (0, path_1.join)(process.cwd(), 'uploads');
        const authSecret = process.env.AUTH_SECRET || '';
        app.use('/uploads', (req, res, next) => {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ message: 'Authentication required' });
            }
            const token = authHeader.slice(7);
            try {
                (0, jsonwebtoken_1.verify)(token, authSecret);
                next();
            }
            catch {
                return res.status(401).json({ message: 'Invalid or expired token' });
            }
        });
        app.useStaticAssets(uploadsDir, { prefix: '/uploads' });
    }
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalFilters(new prisma_exception_filter_1.PrismaExceptionFilter());
    const reflector = app.get(core_2.Reflector);
    const idempotencyService = app.get(idempotency_service_1.IdempotencyService);
    app.useGlobalGuards(new idempotency_guard_1.IdempotencyGuard(reflector, idempotencyService));
    const port = process.env.PORT || 4000;
    const healthService = app.get(health_service_1.HealthService);
    const healthHandler = async (_req, res) => {
        const result = await healthService.check();
        const statusCode = result.status === 'ok' ? 200 : 503;
        res.status(statusCode).json(result);
    };
    app.getHttpAdapter().get('/api/health', healthHandler);
    app.getHttpAdapter().get('/api/v1/health', healthHandler);
    if (process.env.NODE_ENV === 'production') {
        const smtpConfigured = !!(process.env.SMTP_HOST &&
            process.env.SMTP_USER &&
            process.env.SMTP_PASS);
        const fcmConfigured = !!(process.env.FCM_CREDENTIALS_PATH || process.env.FCM_SERVER_KEY);
        if (!smtpConfigured)
            logger.warn('SMTP not configured — email notifications will be disabled');
        if (!fcmConfigured)
            logger.warn('FCM not configured — push notifications will be disabled');
    }
    await app.listen(port);
    app.enableShutdownHooks();
    logger.log(`Backend running on http://localhost:${port}`);
}
void bootstrap();
//# sourceMappingURL=main.js.map