"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceScoreModule = void 0;
const common_1 = require("@nestjs/common");
const performance_engine_1 = require("./performance.engine");
const performance_service_1 = require("./performance.service");
const performance_projector_1 = require("./performance.projector");
const performance_controller_1 = require("./performance.controller");
const governance_events_module_1 = require("../governance-events/governance-events.module");
let PerformanceScoreModule = class PerformanceScoreModule {
};
exports.PerformanceScoreModule = PerformanceScoreModule;
exports.PerformanceScoreModule = PerformanceScoreModule = __decorate([
    (0, common_1.Module)({
        imports: [governance_events_module_1.GovernanceEventsModule],
        controllers: [performance_controller_1.PerformanceScoreController],
        providers: [performance_engine_1.PerformanceEngine, performance_service_1.PerformanceService, performance_projector_1.PerformanceProjector],
        exports: [performance_service_1.PerformanceService, performance_engine_1.PerformanceEngine],
    })
], PerformanceScoreModule);
//# sourceMappingURL=performance.module.js.map