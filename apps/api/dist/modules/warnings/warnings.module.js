"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarningsModule = void 0;
const common_1 = require("@nestjs/common");
const warnings_controller_1 = require("./warnings.controller");
const warnings_service_1 = require("./warnings.service");
const warning_approval_listener_1 = require("./warning-approval.listener");
const warning_expiration_worker_1 = require("./warning-expiration.worker");
const warning_ack_sla_worker_1 = require("./warning-ack-sla.worker");
const prisma_service_1 = require("../../config/prisma.service");
const approvals_module_1 = require("../approvals/approvals.module");
let WarningsModule = class WarningsModule {
};
exports.WarningsModule = WarningsModule;
exports.WarningsModule = WarningsModule = __decorate([
    (0, common_1.Module)({
        imports: [approvals_module_1.ApprovalsModule],
        controllers: [warnings_controller_1.WarningsController],
        providers: [
            prisma_service_1.PrismaService,
            warnings_service_1.WarningsService,
            warning_approval_listener_1.WarningApprovalListener,
            warning_expiration_worker_1.WarningExpirationWorker,
            warning_ack_sla_worker_1.WarningAckSlaWorker,
        ],
        exports: [warnings_service_1.WarningsService],
    })
], WarningsModule);
//# sourceMappingURL=warnings.module.js.map