"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentEntriesController = void 0;
const common_1 = require("@nestjs/common");
const payment_entries_service_1 = require("./payment-entries.service");
const create_payment_entry_dto_1 = require("./dto/create-payment-entry.dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const permissions_1 = require("../../common/auth/permissions");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const idempotency_decorator_1 = require("../../common/decorators/idempotency.decorator");
let PaymentEntriesController = class PaymentEntriesController {
    service;
    constructor(service) {
        this.service = service;
    }
    async findByBooking(bookingId, companyId) {
        return this.service.findByBooking(bookingId, companyId);
    }
    async create(bookingId, dto, currentUserId, companyId) {
        return this.service.create(bookingId, dto, currentUserId, companyId);
    }
    async update(id, dto, companyId) {
        return this.service.update(id, dto, companyId);
    }
    async remove(id, companyId) {
        return this.service.remove(id, companyId);
    }
};
exports.PaymentEntriesController = PaymentEntriesController;
__decorate([
    (0, common_1.Get)('booking/:bookingId'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.ACCOUNTS),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.PAYMENT_READ),
    __param(0, (0, common_1.Param)('bookingId')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PaymentEntriesController.prototype, "findByBooking", null);
__decorate([
    (0, common_1.Post)('booking/:bookingId'),
    (0, idempotency_decorator_1.UseIdempotency)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.ACCOUNTS),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.PAYMENT_CREATE),
    __param(0, (0, common_1.Param)('bookingId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(3, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_payment_entry_dto_1.CreatePaymentEntryDto, String, String]),
    __metadata("design:returntype", Promise)
], PaymentEntriesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.ACCOUNTS),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.PAYMENT_CREATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_payment_entry_dto_1.UpdatePaymentEntryDto, String]),
    __metadata("design:returntype", Promise)
], PaymentEntriesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.ACCOUNTS),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.PAYMENT_CREATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PaymentEntriesController.prototype, "remove", null);
exports.PaymentEntriesController = PaymentEntriesController = __decorate([
    (0, common_1.Controller)('payment-entries'),
    __metadata("design:paramtypes", [payment_entries_service_1.PaymentEntriesService])
], PaymentEntriesController);
//# sourceMappingURL=payment-entries.controller.js.map