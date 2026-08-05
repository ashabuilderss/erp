"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DesignationsModule = void 0;
const common_1 = require("@nestjs/common");
const designations_service_1 = require("./designations.service");
const designations_controller_1 = require("./designations.controller");
let DesignationsModule = class DesignationsModule {
};
exports.DesignationsModule = DesignationsModule;
exports.DesignationsModule = DesignationsModule = __decorate([
    (0, common_1.Module)({
        controllers: [designations_controller_1.DesignationsController],
        providers: [designations_service_1.DesignationsService],
        exports: [designations_service_1.DesignationsService],
    })
], DesignationsModule);
//# sourceMappingURL=designations.module.js.map