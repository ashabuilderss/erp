"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionGrantsModule = void 0;
const common_1 = require("@nestjs/common");
const permission_grants_controller_1 = require("./permission-grants.controller");
const permission_grants_service_1 = require("./permission-grants.service");
let PermissionGrantsModule = class PermissionGrantsModule {
};
exports.PermissionGrantsModule = PermissionGrantsModule;
exports.PermissionGrantsModule = PermissionGrantsModule = __decorate([
    (0, common_1.Module)({
        controllers: [permission_grants_controller_1.PermissionGrantsController],
        providers: [permission_grants_service_1.PermissionGrantsService],
        exports: [permission_grants_service_1.PermissionGrantsService],
    })
], PermissionGrantsModule);
//# sourceMappingURL=permission-grants.module.js.map