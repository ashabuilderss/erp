"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EodModule = void 0;
const common_1 = require("@nestjs/common");
const eod_reports_controller_1 = require("./eod-reports.controller");
const eod_reports_service_1 = require("./eod-reports.service");
let EodModule = class EodModule {
};
exports.EodModule = EodModule;
exports.EodModule = EodModule = __decorate([
    (0, common_1.Module)({
        controllers: [eod_reports_controller_1.EodReportsController],
        providers: [eod_reports_service_1.EodReportsService],
    })
], EodModule);
//# sourceMappingURL=eod-reports.module.js.map