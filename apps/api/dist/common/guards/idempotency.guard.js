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
var IdempotencyGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdempotencyGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const idempotency_service_1 = require("../services/idempotency.service");
const idempotency_decorator_1 = require("../decorators/idempotency.decorator");
let IdempotencyGuard = IdempotencyGuard_1 = class IdempotencyGuard {
    reflector;
    idempotencyService;
    logger = new common_1.Logger(IdempotencyGuard_1.name);
    constructor(reflector, idempotencyService) {
        this.reflector = reflector;
        this.idempotencyService = idempotencyService;
    }
    async canActivate(context) {
        const needsIdempotency = this.reflector.getAllAndOverride(idempotency_decorator_1.IDEMPOTENCY_KEY, [context.getHandler(), context.getClass()]);
        if (!needsIdempotency) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const user = request.user;
        const companyId = user?.companyId ?? 'unknown';
        let idempotencyKey = request.headers['idempotency-key'] ||
            request.headers['x-idempotency-key'] ||
            '';
        let generatedKey = false;
        if (!idempotencyKey) {
            idempotencyKey = this.idempotencyService.generateKey();
            generatedKey = true;
        }
        response.setHeader('Idempotency-Key', idempotencyKey);
        const result = await this.idempotencyService.check(idempotencyKey, companyId);
        switch (result.status) {
            case 'completed': {
                response.setHeader('X-Idempotent-Replayed', 'true');
                response.status(result.statusCode).json(result.body);
                return false;
            }
            case 'error': {
                response.setHeader('X-Idempotent-Replayed', 'true');
                response.status(result.statusCode).json(result.body);
                return false;
            }
            case 'in_progress': {
                response
                    .status(409)
                    .json({
                    statusCode: 409,
                    message: 'A request with this idempotency key is already being processed. Retry after a short delay.',
                    error: 'Conflict',
                });
                return false;
            }
            case 'new': {
                await this.idempotencyService.markInProgress(idempotencyKey, companyId);
                this.interceptResponse(response, idempotencyKey, companyId);
                request._idempotencyKey = idempotencyKey;
                request._idempotencyGenerated = generatedKey;
                return true;
            }
        }
    }
    interceptResponse(response, idempotencyKey, companyId) {
        const originalJson = response.json.bind(response);
        let captured = false;
        response.json = (body) => {
            if (!captured) {
                captured = true;
                const statusCode = response.statusCode || 200;
                if (statusCode >= 200 && statusCode < 300) {
                    this.idempotencyService
                        .markCompleted(idempotencyKey, companyId, body, statusCode)
                        .catch((err) => this.logger.warn('Failed to cache idempotent response', err));
                }
                else {
                    this.idempotencyService
                        .markError(idempotencyKey, companyId, body, statusCode)
                        .catch((err) => this.logger.warn('Failed to cache idempotent error', err));
                }
            }
            return originalJson(body);
        };
    }
};
exports.IdempotencyGuard = IdempotencyGuard;
exports.IdempotencyGuard = IdempotencyGuard = IdempotencyGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        idempotency_service_1.IdempotencyService])
], IdempotencyGuard);
//# sourceMappingURL=idempotency.guard.js.map