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
exports.EscalationRulesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
let EscalationRulesService = class EscalationRulesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(companyId) {
        return this.prisma.escalationRule.findMany({
            where: { companyId },
            orderBy: { level: 'asc' },
        });
    }
    async create(dto, companyId) {
        return this.prisma.escalationRule.create({
            data: {
                companyId,
                name: dto.name,
                triggerType: dto.triggerType,
                config: dto.config,
                level: dto.level,
                notifyRoles: dto.notifyRoles,
                isActive: dto.isActive ?? true,
            },
        });
    }
    async update(id, dto, companyId) {
        const rule = await this.prisma.escalationRule.findFirst({
            where: { id, companyId },
        });
        if (!rule)
            throw new common_1.NotFoundException('Escalation rule not found');
        return this.prisma.escalationRule.update({
            where: { id },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.triggerType !== undefined && { triggerType: dto.triggerType }),
                ...(dto.config !== undefined && { config: dto.config }),
                ...(dto.level !== undefined && { level: dto.level }),
                ...(dto.notifyRoles !== undefined && { notifyRoles: dto.notifyRoles }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
            },
        });
    }
    async remove(id, companyId) {
        const rule = await this.prisma.escalationRule.findFirst({
            where: { id, companyId },
        });
        if (!rule)
            throw new common_1.NotFoundException('Escalation rule not found');
        return this.prisma.escalationRule.update({ where: { id }, data: { deletedAt: new Date() } });
    }
};
exports.EscalationRulesService = EscalationRulesService;
exports.EscalationRulesService = EscalationRulesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EscalationRulesService);
//# sourceMappingURL=escalation-rules.service.js.map