"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityEventsModule = void 0;
const common_1 = require("@nestjs/common");
const security_events_service_1 = require("./security-events.service");
const security_events_controller_1 = require("./security-events.controller");
const security_event_listener_1 = require("./security-event-listener");
let SecurityEventsModule = class SecurityEventsModule {
};
exports.SecurityEventsModule = SecurityEventsModule;
exports.SecurityEventsModule = SecurityEventsModule = __decorate([
    (0, common_1.Module)({
        controllers: [security_events_controller_1.SecurityEventsController],
        providers: [security_events_service_1.SecurityEventsService, security_event_listener_1.SecurityEventListener],
    })
], SecurityEventsModule);
//# sourceMappingURL=security-events.module.js.map