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
var HoldRecommendationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HoldRecommendationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
const client_1 = require("@prisma/client");
const approvals_1 = require("../approvals");
let HoldRecommendationService = HoldRecommendationService_1 = class HoldRecommendationService {
    prisma;
    spawningService;
    logger = new common_1.Logger(HoldRecommendationService_1.name);
    constructor(prisma, spawningService) {
        this.prisma = prisma;
        this.spawningService = spawningService;
    }
    async createRecommendation(companyId, createdByUserId, dto) {
        let creatorEmployeeId = null;
        let creatorUserId = createdByUserId;
        if (createdByUserId) {
            const creator = await this.prisma.employee.findFirst({
                where: { userId: createdByUserId, companyId },
            });
            if (creator) {
                creatorEmployeeId = creator.id;
                creatorUserId = createdByUserId;
            }
        }
        const employee = await this.prisma.employee.findFirst({
            where: { id: dto.employeeId, companyId },
        });
        if (!employee)
            throw new common_1.BadRequestException('Employee not found.');
        if (dto.source === 'TASK_ENGINE' && !dto.sourceId)
            throw new common_1.BadRequestException('Task ID required for TASK_ENGINE source.');
        if (dto.source === 'WARNING_ENGINE' && !dto.sourceId)
            throw new common_1.BadRequestException('Warning ID required for WARNING_ENGINE source.');
        if (dto.holdType === client_1.PayrollHoldType.PARTIAL_HOLD && !dto.amount) {
            throw new common_1.BadRequestException('Amount is required for PARTIAL_HOLD.');
        }
        return await this.prisma.$transaction(async (tx) => {
            const existingHold = await tx.payrollHold.findFirst({
                where: {
                    companyId,
                    employeeId: employee.id,
                    source: dto.source,
                    sourceId: dto.sourceId,
                    status: {
                        in: [
                            client_1.PayrollHoldStatus.REQUESTED,
                            client_1.PayrollHoldStatus.UNDER_REVIEW,
                            client_1.PayrollHoldStatus.ACTIVE_HOLD,
                            client_1.PayrollHoldStatus.RELEASE_REQUESTED,
                        ],
                    },
                },
            });
            if (existingHold) {
                this.logger.debug(`Deduplication triggered for hold source: ${dto.source}, sourceId: ${dto.sourceId}`);
                return existingHold;
            }
            const hold = await tx.payrollHold.create({
                data: {
                    companyId,
                    employeeId: employee.id,
                    source: dto.source,
                    sourceId: dto.sourceId,
                    holdType: dto.holdType,
                    amount: dto.amount,
                    reason: dto.reason,
                    evidenceUri: dto.evidenceUri,
                    createdById: creatorEmployeeId,
                    status: client_1.PayrollHoldStatus.REQUESTED,
                },
            });
            await tx.payrollHoldHistory.create({
                data: {
                    holdId: hold.id,
                    companyId,
                    event: 'HOLD_RECOMMENDED',
                    actorId: creatorEmployeeId,
                    comments: `Payroll Hold Recommended. Type: ${dto.holdType}, Source: ${dto.source}`,
                },
            });
            const requesterUserId = creatorUserId || employee.userId;
            const approvalReq = await this.spawningService.spawnRequest(companyId, 'PAYROLL_HOLD', hold.id, requesterUserId);
            await tx.payrollHold.update({
                where: { id: hold.id },
                data: { approvalId: approvalReq.id },
            });
            return hold;
        });
    }
};
exports.HoldRecommendationService = HoldRecommendationService;
exports.HoldRecommendationService = HoldRecommendationService = HoldRecommendationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        approvals_1.ApprovalsSpawningService])
], HoldRecommendationService);
//# sourceMappingURL=hold-recommendation.service.js.map