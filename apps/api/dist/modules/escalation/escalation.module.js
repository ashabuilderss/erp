"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscalationModule = void 0;
const common_1 = require("@nestjs/common");
const escalation_rules_controller_1 = require("./escalation-rules.controller");
const escalation_rules_service_1 = require("./escalation-rules.service");
const escalation_events_controller_1 = require("./escalation-events.controller");
const escalation_events_service_1 = require("./escalation-events.service");
let EscalationModule = class EscalationModule {
};
exports.EscalationModule = EscalationModule;
exports.EscalationModule = EscalationModule = __decorate([
    (0, common_1.Module)({
        controllers: [escalation_rules_controller_1.EscalationRulesController, escalation_events_controller_1.EscalationEventsController],
        providers: [escalation_rules_service_1.EscalationRulesService, escalation_events_service_1.EscalationEventsService],
    })
], EscalationModule);
//# sourceMappingURL=escalation.module.js.map