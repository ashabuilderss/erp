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
var SoftDeleteService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SoftDeleteService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
let SoftDeleteService = SoftDeleteService_1 = class SoftDeleteService {
    prisma;
    logger = new common_1.Logger(SoftDeleteService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async enforceDeletionGovernance(companyId, entityType, entityId, deletedById, reason, userRole) {
        const criticalEntities = [
            'EMPLOYEE',
            'TASK',
            'WARNING',
            'PAYROLL_HOLD',
            'PROPERTY',
        ];
        if (criticalEntities.includes(entityType.toUpperCase())) {
            if (userRole !== 'OWNER' && userRole !== 'ADMIN') {
                throw new common_1.ForbiddenException(`Role ${userRole} is not authorized to delete ${entityType} records.`);
            }
        }
        await this.prisma.deletionLog.create({
            data: {
                companyId,
                entityId,
                entityType: entityType.toUpperCase(),
                userId: deletedById,
                reason,
            },
        });
        this.logger.log(`Deletion Governance: ${entityType} ${entityId} approved for deletion by ${deletedById}`);
    }
};
exports.SoftDeleteService = SoftDeleteService;
exports.SoftDeleteService = SoftDeleteService = SoftDeleteService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SoftDeleteService);
//# sourceMappingURL=soft-delete.service.js.map