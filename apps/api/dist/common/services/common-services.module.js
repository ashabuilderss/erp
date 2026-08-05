"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonServicesModule = void 0;
const common_1 = require("@nestjs/common");
const transition_service_1 = require("./transition.service");
const advisory_lock_service_1 = require("./advisory-lock.service");
const health_service_1 = require("./health.service");
const soft_delete_service_1 = require("./soft-delete.service");
const idempotency_service_1 = require("./idempotency.service");
let CommonServicesModule = class CommonServicesModule {
};
exports.CommonServicesModule = CommonServicesModule;
exports.CommonServicesModule = CommonServicesModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            transition_service_1.TransitionService,
            advisory_lock_service_1.AdvisoryLockService,
            health_service_1.HealthService,
            soft_delete_service_1.SoftDeleteService,
            idempotency_service_1.IdempotencyService,
        ],
        exports: [
            transition_service_1.TransitionService,
            advisory_lock_service_1.AdvisoryLockService,
            health_service_1.HealthService,
            soft_delete_service_1.SoftDeleteService,
            idempotency_service_1.IdempotencyService,
        ],
    })
], CommonServicesModule);
//# sourceMappingURL=common-services.module.js.map