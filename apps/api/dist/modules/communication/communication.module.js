"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationModule = void 0;
const common_1 = require("@nestjs/common");
const announcement_controller_1 = require("./announcement.controller");
const document_controller_1 = require("./document.controller");
const announcement_service_1 = require("./announcement.service");
const announcement_receipt_service_1 = require("./announcement-receipt.service");
const document_registry_service_1 = require("./document-registry.service");
const document_access_service_1 = require("./document-access.service");
const audit_module_1 = require("../audit/audit.module");
const notifications_module_1 = require("../notifications/notifications.module");
let CommunicationModule = class CommunicationModule {
};
exports.CommunicationModule = CommunicationModule;
exports.CommunicationModule = CommunicationModule = __decorate([
    (0, common_1.Module)({
        imports: [audit_module_1.AuditModule, notifications_module_1.NotificationsModule],
        controllers: [announcement_controller_1.AnnouncementController, document_controller_1.DocumentController],
        providers: [
            announcement_service_1.AnnouncementService,
            announcement_receipt_service_1.AnnouncementReceiptService,
            document_registry_service_1.DocumentRegistryService,
            document_access_service_1.DocumentAccessService,
        ],
        exports: [
            announcement_service_1.AnnouncementService,
            announcement_receipt_service_1.AnnouncementReceiptService,
            document_registry_service_1.DocumentRegistryService,
            document_access_service_1.DocumentAccessService,
        ],
    })
], CommunicationModule);
//# sourceMappingURL=communication.module.js.map