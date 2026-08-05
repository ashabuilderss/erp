"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var HealthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
const redis_service_1 = require("../../config/redis.service");
let HealthService = HealthService_1 = class HealthService {
    prisma;
    redis;
    logger = new common_1.Logger(HealthService_1.name);
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
    }
    async check() {
        const dbStart = Date.now();
        let dbStatus = 'ok';
        let dbLatency;
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            dbLatency = Date.now() - dbStart;
        }
        catch {
            dbStatus = 'error';
        }
        const redisStart = Date.now();
        let redisStatus = 'skipped';
        let redisLatency;
        try {
            await this.redis.get('health:ping');
            redisLatency = Date.now() - redisStart;
            redisStatus = 'ok';
        }
        catch {
            redisStatus = 'error';
        }
        const smtpConfigured = !!(process.env.SMTP_HOST &&
            process.env.SMTP_USER &&
            process.env.SMTP_PASS);
        const fcmConfigured = !!(process.env.FCM_CREDENTIALS_PATH || process.env.FCM_SERVER_KEY);
        const overallStatus = dbStatus === 'ok' && redisStatus !== 'error' ? 'ok' : 'degraded';
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
};
exports.HealthService = HealthService;
exports.HealthService = HealthService = HealthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], HealthService);
//# sourceMappingURL=health.service.js.map