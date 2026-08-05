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
var IdempotencyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdempotencyService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../../config/redis.service");
const crypto_1 = require("crypto");
const DEFAULT_TTL_SECONDS = 86400;
let IdempotencyService = IdempotencyService_1 = class IdempotencyService {
    redis;
    logger = new common_1.Logger(IdempotencyService_1.name);
    constructor(redis) {
        this.redis = redis;
    }
    generateKey() {
        return (0, crypto_1.randomBytes)(16).toString('hex');
    }
    buildRedisKey(idempotencyKey, companyId) {
        return `idempotency:${companyId}:${idempotencyKey}`;
    }
    async check(idempotencyKey, companyId) {
        const redisKey = this.buildRedisKey(idempotencyKey, companyId);
        const raw = await this.redis.get(redisKey);
        if (!raw) {
            return { status: 'new' };
        }
        if (raw.status === 'in_progress') {
            return { status: 'in_progress' };
        }
        return raw;
    }
    async markInProgress(idempotencyKey, companyId) {
        const redisKey = this.buildRedisKey(idempotencyKey, companyId);
        await this.redis.set(redisKey, { status: 'in_progress' }, DEFAULT_TTL_SECONDS);
    }
    async markCompleted(idempotencyKey, companyId, body, statusCode) {
        const redisKey = this.buildRedisKey(idempotencyKey, companyId);
        await this.redis.set(redisKey, { status: 'completed', body, statusCode }, DEFAULT_TTL_SECONDS);
    }
    async markError(idempotencyKey, companyId, body, statusCode) {
        const redisKey = this.buildRedisKey(idempotencyKey, companyId);
        await this.redis.set(redisKey, { status: 'error', body, statusCode }, DEFAULT_TTL_SECONDS);
    }
};
exports.IdempotencyService = IdempotencyService;
exports.IdempotencyService = IdempotencyService = IdempotencyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], IdempotencyService);
//# sourceMappingURL=idempotency.service.js.map