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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const logger_service_1 = require("../logger/logger.service");
const SENSITIVE_FIELDS = new Set([
    'password',
    'hashedPassword',
    'confirmPassword',
    'currentPassword',
    'newPassword',
    'token',
    'authorization',
    'secret',
    'totpSecret',
    'backupCodes',
    'encryptionKey',
    'authSecret',
    'postgresPassword',
    'redisPassword',
    'otp',
    'totp',
    'nonce',
]);
const SENSITIVE_URL_PATTERNS = /password|token|secret|otp|totp|nonce/i;
function sanitizeData(data) {
    if (!data || typeof data !== 'object')
        return data;
    if (Array.isArray(data))
        return data.map(sanitizeData);
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
        if (SENSITIVE_FIELDS.has(key)) {
            cleaned[key] = '[REDACTED]';
        }
        else if (typeof value === 'object' && value !== null) {
            cleaned[key] = sanitizeData(value);
        }
        else {
            cleaned[key] = value;
        }
    }
    return cleaned;
}
function sanitizeUrl(url) {
    if (!SENSITIVE_URL_PATTERNS.test(url))
        return url;
    try {
        const parsed = new URL(url, 'http://localhost');
        const params = parsed.searchParams;
        for (const [key] of params) {
            if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
                params.set(key, '[REDACTED]');
            }
        }
        return url.includes('?') ? `${parsed.pathname}${parsed.search}` : url;
    }
    catch {
        return url;
    }
}
let LoggingInterceptor = class LoggingInterceptor {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const { method, url } = request;
        const sanitizedUrl = sanitizeUrl(url);
        const start = Date.now();
        return next.handle().pipe((0, rxjs_1.tap)({
            next: () => {
                const response = context.switchToHttp().getResponse();
                const duration = Date.now() - start;
                this.logger.requestLog(method, sanitizedUrl, response.statusCode, duration);
            },
            error: (error) => {
                const duration = Date.now() - start;
                this.logger.requestLog(method, sanitizedUrl, error.status || 500, duration);
                const safeMessage = sanitizeData(error.message || 'Unknown error');
                this.logger.error(`${method} ${sanitizedUrl} - ${safeMessage}`, error.stack, 'HTTP');
            },
        }));
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logger_service_1.LoggerService])
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map