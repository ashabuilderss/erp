"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SiteVisitsModule = void 0;
const common_1 = require("@nestjs/common");
const site_visits_service_1 = require("./site-visits.service");
const site_visits_controller_1 = require("./site-visits.controller");
let SiteVisitsModule = class SiteVisitsModule {
};
exports.SiteVisitsModule = SiteVisitsModule;
exports.SiteVisitsModule = SiteVisitsModule = __decorate([
    (0, common_1.Module)({
        controllers: [site_visits_controller_1.SiteVisitsController],
        providers: [site_visits_service_1.SiteVisitsService],
        exports: [site_visits_service_1.SiteVisitsService],
    })
], SiteVisitsModule);
//# sourceMappingURL=site-visits.module.js.map