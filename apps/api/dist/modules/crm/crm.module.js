"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmModule = void 0;
const common_1 = require("@nestjs/common");
const properties_module_1 = require("./properties/properties.module");
const leads_module_1 = require("./leads/leads.module");
const customers_module_1 = require("./customers/customers.module");
const site_visits_module_1 = require("./site-visits/site-visits.module");
const bookings_module_1 = require("./bookings/bookings.module");
const quotations_module_1 = require("./quotations/quotations.module");
const brokers_module_1 = require("./brokers/brokers.module");
let CrmModule = class CrmModule {
};
exports.CrmModule = CrmModule;
exports.CrmModule = CrmModule = __decorate([
    (0, common_1.Module)({
        imports: [
            properties_module_1.PropertiesModule,
            leads_module_1.LeadsModule,
            customers_module_1.CustomersModule,
            site_visits_module_1.SiteVisitsModule,
            bookings_module_1.BookingsModule,
            quotations_module_1.QuotationsModule,
            brokers_module_1.BrokersModule,
        ],
        controllers: [],
    })
], CrmModule);
//# sourceMappingURL=crm.module.js.map