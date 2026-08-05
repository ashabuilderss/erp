"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChartOfAccountsModule = void 0;
const common_1 = require("@nestjs/common");
const chart_of_accounts_service_1 = require("./chart-of-accounts.service");
const chart_of_accounts_controller_1 = require("./chart-of-accounts.controller");
let ChartOfAccountsModule = class ChartOfAccountsModule {
};
exports.ChartOfAccountsModule = ChartOfAccountsModule;
exports.ChartOfAccountsModule = ChartOfAccountsModule = __decorate([
    (0, common_1.Module)({
        controllers: [chart_of_accounts_controller_1.ChartOfAccountsController],
        providers: [chart_of_accounts_service_1.ChartOfAccountsService],
        exports: [chart_of_accounts_service_1.ChartOfAccountsService],
    })
], ChartOfAccountsModule);
//# sourceMappingURL=chart-of-accounts.module.js.map