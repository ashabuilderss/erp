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
exports.CompaniesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
const encryption_service_1 = require("../../common/services/encryption.service");
let CompaniesService = class CompaniesService {
    prisma;
    encryptionService;
    constructor(prisma, encryptionService) {
        this.prisma = prisma;
        this.encryptionService = encryptionService;
    }
    async findAll(companyId) {
        return this.prisma.company.findMany({
            where: { id: companyId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findById(id) {
        const company = await this.prisma.company.findUnique({ where: { id } });
        if (!company)
            throw new common_1.NotFoundException('Company not found');
        return company;
    }
    async update(id, dto) {
        const company = await this.prisma.company.findUnique({ where: { id } });
        if (!company)
            throw new common_1.NotFoundException('Company not found');
        const data = {
            ...(dto.name !== undefined && { name: dto.name }),
            ...(dto.slug !== undefined && { slug: dto.slug }),
            ...(dto.isActive !== undefined && { isActive: dto.isActive }),
            ...(dto.settings !== undefined && {
                settings: dto.settings,
            }),
        };
        return this.prisma.company.update({ where: { id }, data });
    }
    async getSettings(companyId) {
        const company = await this.findById(companyId);
        const raw = company.settings;
        return {
            debugLogging: raw?.debugLogging ?? false,
            sessionTimeoutMinutes: raw?.sessionTimeoutMinutes ?? 60,
            passwordMinLength: raw?.passwordMinLength ?? 8,
            passwordRequireSpecialChar: raw?.passwordRequireSpecialChar ?? false,
            maxLoginAttempts: raw?.maxLoginAttempts ?? 5,
            encryptSensitiveFields: raw?.encryptSensitiveFields ?? false,
            allowedIpAddresses: raw?.allowedIpAddresses ?? [],
            mfaRequired: raw?.mfaRequired ?? false,
        };
    }
    async updateSettings(companyId, dto) {
        const company = await this.findById(companyId);
        const current = company.settings ?? {};
        const merged = { ...current };
        const fields = [
            'debugLogging', 'sessionTimeoutMinutes', 'passwordMinLength',
            'passwordRequireSpecialChar', 'maxLoginAttempts',
            'encryptSensitiveFields', 'allowedIpAddresses', 'mfaRequired',
        ];
        for (const field of fields) {
            if (dto[field] !== undefined) {
                merged[field] = dto[field];
            }
        }
        await this.prisma.company.update({
            where: { id: companyId },
            data: { settings: merged },
        });
        return this.getSettings(companyId);
    }
};
exports.CompaniesService = CompaniesService;
exports.CompaniesService = CompaniesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        encryption_service_1.EncryptionService])
], CompaniesService);
//# sourceMappingURL=companies.service.js.map