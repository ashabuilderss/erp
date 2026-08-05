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
var CacheInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheInterceptor = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const redis_service_1 = require("../../config/redis.service");
const cache_decorators_1 = require("../decorators/cache.decorators");
const crypto_1 = require("crypto");
const EXCLUDED_PATHS = [
    '/auth/',
    '/uploads/',
    '/attendance/events',
    '/attendance/nonce',
    '/events/stream',
    '/notifications/stream',
    '/attendance/me/check-in',
    '/attendance/me/check-out',
    '/activity-logs/export',
    '/health',
];
const RESOURCE_TTL = {
    designations: 300,
    departments: 300,
    companies: 300,
    employees: 120,
    customers: 120,
    'construction-sites': 120,
    vendors: 120,
    materials: 120,
    brokers: 120,
    dealers: 120,
    incentives: 120,
    reports: 300,
};
let CacheInterceptor = CacheInterceptor_1 = class CacheInterceptor {
    redisService;
    reflector;
    logger = new common_1.Logger(CacheInterceptor_1.name);
    constructor(redisService, reflector) {
        this.redisService = redisService;
        this.reflector = reflector;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const method = request.method;
        const path = request.path || '';
        const normalizedPath = path.replace(/^\/api\/v1/, '');
        const pathToMatch = normalizedPath.startsWith('/api/')
            ? normalizedPath.replace(/^\/api/, '')
            : normalizedPath;
        if (EXCLUDED_PATHS.some((p) => pathToMatch.startsWith(p)))
            return next.handle();
        const noCache = this.reflector.get(cache_decorators_1.NOCACHE_KEY, context.getHandler());
        if (noCache)
            return next.handle();
        if (method === 'GET')
            return this.handleGet(request, next);
        if (['POST', 'PATCH', 'DELETE'].includes(method))
            return this.handleMutation(context, request, next);
        return next.handle();
    }
    handleGet(request, next) {
        const key = this.buildCacheKey(request);
        return new rxjs_1.Observable((subscriber) => {
            this.redisService
                .get(key)
                .then((cached) => {
                if (cached !== null) {
                    subscriber.next(cached);
                    subscriber.complete();
                    return;
                }
                next.handle().subscribe({
                    next: (data) => {
                        const ttl = this.getTTL(request.path);
                        this.redisService.set(key, data, ttl).catch(() => { });
                        subscriber.next(data);
                    },
                    error: (err) => subscriber.error(err),
                    complete: () => subscriber.complete(),
                });
            })
                .catch(() => {
                next.handle().subscribe({
                    next: (data) => subscriber.next(data),
                    error: (err) => subscriber.error(err),
                    complete: () => subscriber.complete(),
                });
            });
        });
    }
    handleMutation(context, request, next) {
        const extraResources = this.reflector.get(cache_decorators_1.CACHE_INVALIDATE_EXTRA_KEY, context.getHandler()) || [];
        const resource = this.inferResource(request.path);
        const companyId = request.user?.companyId;
        const analyticsTriggers = [
            'leads',
            'bookings',
            'properties',
            'site-visits',
            'customers',
            'commissions',
            'incentives',
        ];
        return next.handle().pipe((0, operators_1.tap)(() => {
            if (!companyId)
                return;
            this.redisService
                .delByPattern('cache:' + resource + ':' + companyId + ':*')
                .catch(() => { });
            for (const extra of extraResources) {
                this.redisService
                    .delByPattern('cache:' + extra + ':' + companyId + ':*')
                    .catch(() => { });
            }
            if (analyticsTriggers.includes(resource)) {
                this.redisService
                    .delByPattern('analytics:*:' + companyId + ':*')
                    .catch(() => { });
            }
        }));
    }
    buildCacheKey(request) {
        const companyId = request.user?.companyId || 'global';
        const userId = request.user?.id || '';
        const path = request.path.replace(/^\/api/, '');
        const query = request.query
            ? JSON.stringify(request.query, Object.keys(request.query).sort())
            : '';
        const queryHash = query
            ? (0, crypto_1.createHash)('md5').update(query).digest('hex').slice(0, 8)
            : '';
        const resource = this.inferResource(request.path);
        return ('cache:' +
            resource +
            ':' +
            companyId +
            ':' +
            userId +
            ':' +
            path +
            ':' +
            queryHash);
    }
    inferResource(path) {
        const cleaned = path.replace(/^\/api\//, '');
        return cleaned.split('/')[0] || 'unknown';
    }
    getTTL(path) {
        const normalized = path.replace(/^\/api\/v1/, '');
        if (normalized.startsWith('reports/catalog'))
            return 300;
        const resource = this.inferResource(normalized);
        return RESOURCE_TTL[resource] ?? 60;
    }
};
exports.CacheInterceptor = CacheInterceptor;
exports.CacheInterceptor = CacheInterceptor = CacheInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        core_1.Reflector])
], CacheInterceptor);
//# sourceMappingURL=cache.interceptor.js.map