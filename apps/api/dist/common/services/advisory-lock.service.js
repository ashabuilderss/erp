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
var AdvisoryLockService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvisoryLockService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
let AdvisoryLockService = AdvisoryLockService_1 = class AdvisoryLockService {
    prisma;
    logger = new common_1.Logger(AdvisoryLockService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async tryLock(key) {
        try {
            const result = await this.prisma.$queryRawUnsafe('SELECT pg_try_advisory_lock($1)', key);
            const acquired = result?.[0]?.pg_try_advisory_lock === true;
            if (acquired) {
                this.logger.debug(`Advisory lock acquired: ${key}`);
            }
            return acquired;
        }
        catch (err) {
            this.logger.error(`Failed to acquire advisory lock ${key}: ${err}`);
            return false;
        }
    }
    async unlock(key) {
        try {
            await this.prisma.$queryRawUnsafe('SELECT pg_advisory_unlock($1)', key);
            this.logger.debug(`Advisory lock released: ${key}`);
        }
        catch (err) {
            this.logger.error(`Failed to release advisory lock ${key}: ${err}`);
        }
    }
    async runWithLock(key, fn) {
        const acquired = await this.tryLock(key);
        if (!acquired) {
            this.logger.warn(`Could not acquire advisory lock ${key}, skipping`);
            return null;
        }
        try {
            return await fn();
        }
        finally {
            await this.unlock(key);
        }
    }
};
exports.AdvisoryLockService = AdvisoryLockService;
exports.AdvisoryLockService = AdvisoryLockService = AdvisoryLockService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdvisoryLockService);
//# sourceMappingURL=advisory-lock.service.js.map