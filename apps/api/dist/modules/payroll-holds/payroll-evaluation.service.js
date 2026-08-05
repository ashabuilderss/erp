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
var PayrollEvaluationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollEvaluationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
const client_1 = require("@prisma/client");
let PayrollEvaluationService = PayrollEvaluationService_1 = class PayrollEvaluationService {
    prisma;
    logger = new common_1.Logger(PayrollEvaluationService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async evaluateHold(employeeId) {
        const activeHolds = await this.prisma.payrollHold.findMany({
            where: {
                employeeId,
                status: {
                    in: [
                        client_1.PayrollHoldStatus.ACTIVE_HOLD,
                        client_1.PayrollHoldStatus.RELEASE_REQUESTED,
                    ],
                },
            },
        });
        if (activeHolds.length === 0) {
            return {
                hasHold: false,
                incentivesBlocked: false,
                paymentDeferred: false,
            };
        }
        const types = activeHolds.map((h) => h.holdType);
        if (types.includes(client_1.PayrollHoldType.FULL_HOLD)) {
            return {
                hasHold: true,
                salaryOverride: 0,
                incentivesBlocked: true,
                paymentDeferred: false,
            };
        }
        if (types.includes(client_1.PayrollHoldType.DEFERRED_PAYMENT)) {
            return {
                hasHold: true,
                incentivesBlocked: false,
                paymentDeferred: true,
            };
        }
        let salaryDeduction = 0;
        let incentivesBlocked = false;
        for (const hold of activeHolds) {
            if (hold.holdType === client_1.PayrollHoldType.PARTIAL_HOLD && hold.amount) {
                salaryDeduction += Number(hold.amount);
            }
            if (hold.holdType === client_1.PayrollHoldType.INCENTIVE_HOLD) {
                incentivesBlocked = true;
            }
        }
        return {
            hasHold: true,
            salaryDeduction: salaryDeduction > 0 ? salaryDeduction : undefined,
            incentivesBlocked,
            paymentDeferred: false,
        };
    }
    async safeEvaluateHold(employeeId) {
        try {
            return await this.evaluateHold(employeeId);
        }
        catch (error) {
            this.logger.error(`Failed to evaluate holds for employee ${employeeId}. Error isolated.`, error);
            return {
                hasHold: false,
                incentivesBlocked: false,
                paymentDeferred: false,
            };
        }
    }
};
exports.PayrollEvaluationService = PayrollEvaluationService;
exports.PayrollEvaluationService = PayrollEvaluationService = PayrollEvaluationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PayrollEvaluationService);
//# sourceMappingURL=payroll-evaluation.service.js.map