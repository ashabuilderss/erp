"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceRegistrationsModule = void 0;
const common_1 = require("@nestjs/common");
const device_registrations_service_1 = require("./device-registrations.service");
const device_registrations_controller_1 = require("./device-registrations.controller");
let DeviceRegistrationsModule = class DeviceRegistrationsModule {
};
exports.DeviceRegistrationsModule = DeviceRegistrationsModule;
exports.DeviceRegistrationsModule = DeviceRegistrationsModule = __decorate([
    (0, common_1.Module)({
        controllers: [device_registrations_controller_1.DeviceRegistrationsController],
        providers: [device_registrations_service_1.DeviceRegistrationsService],
        exports: [device_registrations_service_1.DeviceRegistrationsService],
    })
], DeviceRegistrationsModule);
//# sourceMappingURL=device-registrations.module.js.map