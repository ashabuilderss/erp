"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortalsModule = void 0;
const common_1 = require("@nestjs/common");
const portals_service_1 = require("./portals.service");
const portals_controller_1 = require("./portals.controller");
let PortalsModule = class PortalsModule {
};
exports.PortalsModule = PortalsModule;
exports.PortalsModule = PortalsModule = __decorate([
    (0, common_1.Module)({
        controllers: [portals_controller_1.PortalsController],
        providers: [portals_service_1.PortalsService],
        exports: [portals_service_1.PortalsService],
    })
], PortalsModule);
//# sourceMappingURL=portals.module.js.map