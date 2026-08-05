"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollHoldsModule = void 0;
const common_1 = require("@nestjs/common");
const payroll_holds_controller_1 = require("./payroll-holds.controller");
const hold_recommendation_service_1 = require("./hold-recommendation.service");
const hold_activation_listener_1 = require("./hold-activation.listener");
const hold_release_service_1 = require("./hold-release.service");
const payroll_evaluation_service_1 = require("./payroll-evaluation.service");
const hold_sla_worker_1 = require("./hold-sla.worker");
const prisma_service_1 = require("../../config/prisma.service");
const approvals_module_1 = require("../approvals/approvals.module");
const warning_threshold_breached_listener_1 = require("./warning-threshold-breached.listener");
let PayrollHoldsModule = class PayrollHoldsModule {
};
exports.PayrollHoldsModule = PayrollHoldsModule;
exports.PayrollHoldsModule = PayrollHoldsModule = __decorate([
    (0, common_1.Module)({
        imports: [approvals_module_1.ApprovalsModule],
        controllers: [payroll_holds_controller_1.PayrollHoldsController],
        providers: [
            prisma_service_1.PrismaService,
            hold_recommendation_service_1.HoldRecommendationService,
            hold_activation_listener_1.HoldActivationListener,
            hold_release_service_1.HoldReleaseService,
            payroll_evaluation_service_1.PayrollEvaluationService,
            hold_sla_worker_1.HoldSlaWorker,
            warning_threshold_breached_listener_1.WarningThresholdBreachedListener,
        ],
        exports: [hold_recommendation_service_1.HoldRecommendationService, payroll_evaluation_service_1.PayrollEvaluationService],
    })
], PayrollHoldsModule);
//# sourceMappingURL=payroll-holds.module.js.map