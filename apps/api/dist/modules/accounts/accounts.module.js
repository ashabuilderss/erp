"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountsModule = void 0;
const common_1 = require("@nestjs/common");
const payment_schedules_controller_1 = require("./payment-schedules.controller");
const payment_schedules_service_1 = require("./payment-schedules.service");
const payment_entries_controller_1 = require("./payment-entries.controller");
const payment_entries_service_1 = require("./payment-entries.service");
const expense_claims_controller_1 = require("./expense-claims.controller");
const expense_claims_service_1 = require("./expense-claims.service");
const chart_of_accounts_controller_1 = require("./chart-of-accounts/chart-of-accounts.controller");
const chart_of_accounts_service_1 = require("./chart-of-accounts/chart-of-accounts.service");
let AccountsModule = class AccountsModule {
};
exports.AccountsModule = AccountsModule;
exports.AccountsModule = AccountsModule = __decorate([
    (0, common_1.Module)({
        controllers: [
            payment_schedules_controller_1.PaymentSchedulesController,
            payment_entries_controller_1.PaymentEntriesController,
            expense_claims_controller_1.ExpenseClaimsController,
            chart_of_accounts_controller_1.ChartOfAccountsController,
        ],
        providers: [
            payment_schedules_service_1.PaymentSchedulesService,
            payment_entries_service_1.PaymentEntriesService,
            expense_claims_service_1.ExpenseClaimsService,
            chart_of_accounts_service_1.ChartOfAccountsService,
        ],
        exports: [chart_of_accounts_service_1.ChartOfAccountsService],
    })
], AccountsModule);
//# sourceMappingURL=accounts.module.js.map