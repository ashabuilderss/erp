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
exports.TransitionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
const transition_config_1 = require("./transition.config");
let TransitionService = class TransitionService {
    prisma;
    rules = new Map();
    constructor(prisma) {
        this.prisma = prisma;
        for (const rule of transition_config_1.TRANSITION_RULES) {
            this.rules.set(rule.entityName, rule);
            this.rules.set(rule.prismaModel, rule);
        }
    }
    getRule(entityType) {
        const rule = this.rules.get(entityType);
        if (!rule) {
            throw new common_1.BadRequestException(`No transition rules configured for entity type: ${entityType}`);
        }
        return rule;
    }
    canTransition(entityType, currentStatus, newStatus) {
        const rule = this.getRule(entityType);
        const allowed = rule.transitions[currentStatus];
        if (!allowed)
            return false;
        return allowed.includes(newStatus);
    }
    validate(entityType, currentStatus, newStatus) {
        if (!this.canTransition(entityType, currentStatus, newStatus)) {
            throw new common_1.BadRequestException(`Invalid status transition from ${currentStatus} to ${newStatus}`);
        }
    }
    async execute(op) {
        const { entityType, id, newStatus, companyId, currentUserRole, currentEmployeeId, before, after, include, } = op;
        const rule = this.getRule(entityType);
        const entity = await this.prisma[rule.prismaModel].findFirst({
            where: { id, companyId },
        });
        if (!entity) {
            throw new common_1.BadRequestException(`${rule.entityName} not found with id: ${id}`);
        }
        if (currentUserRole === 'EMPLOYEE' &&
            rule.ownershipField &&
            currentEmployeeId) {
            if (entity[rule.ownershipField] !== currentEmployeeId) {
                throw new common_1.BadRequestException(`Employees can only update status of their own ${rule.entityName.toLowerCase()}s`);
            }
        }
        this.validate(entityType, entity.status ?? entity.state, newStatus);
        return this.prisma.$transaction(async (tx) => {
            if (before) {
                await before(tx, entity);
            }
            const updated = await tx[rule.prismaModel].update({
                where: { id },
                data: { status: newStatus },
                include,
            });
            if (after) {
                await after(updated);
            }
            return updated;
        });
    }
};
exports.TransitionService = TransitionService;
exports.TransitionService = TransitionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TransitionService);
//# sourceMappingURL=transition.service.js.map