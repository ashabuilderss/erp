"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = __importDefault(require("ioredis"));
let RedisService = RedisService_1 = class RedisService {
    client = null;
    logger = new common_1.Logger(RedisService_1.name);
    enabled = false;
    async onModuleInit() {
        const url = process.env.REDIS_URL;
        if (!url) {
            this.logger.warn('REDIS_URL not set, caching disabled');
            return;
        }
        try {
            this.client = new ioredis_1.default(url, {
                maxRetriesPerRequest: 3,
                retryStrategy(times) {
                    if (times > 5)
                        return null;
                    return Math.min(times * 200, 2000);
                },
                lazyConnect: true,
            });
            await this.client.connect();
            this.enabled = true;
            this.logger.log('Connected to Redis');
        }
        catch (err) {
            this.logger.warn('Redis connection failed, caching disabled', err);
        }
    }
    async onModuleDestroy() {
        if (this.client) {
            await this.client.quit();
        }
    }
    async get(key) {
        if (!this.enabled || !this.client)
            return null;
        try {
            const raw = await this.client.get(key);
            if (!raw)
                return null;
            return JSON.parse(raw);
        }
        catch {
            return null;
        }
    }
    async set(key, value, ttl = 60) {
        if (!this.enabled || !this.client)
            return;
        try {
            const serialized = JSON.stringify(value);
            await this.client.setex(key, ttl, serialized);
        }
        catch (err) {
            this.logger.warn('Redis set failed for ' + key, err);
        }
    }
    async del(key) {
        if (!this.enabled || !this.client)
            return;
        try {
            await this.client.del(key);
        }
        catch (err) {
            this.logger.warn('Redis del failed for ' + key, err);
        }
    }
    async delByPattern(pattern) {
        if (!this.enabled || !this.client)
            return;
        try {
            let cursor = '0';
            do {
                const result = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
                cursor = result[0];
                const keys = result[1];
                if (keys.length > 0) {
                    await this.client.del(...keys);
                }
            } while (cursor !== '0');
        }
        catch (err) {
            this.logger.warn('Redis delByPattern failed for ' + pattern, err);
        }
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)()
], RedisService);
//# sourceMappingURL=redis.service.js.map