"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScopeService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let ScopeService = class ScopeService {
    generateFilter(scope, user, ownerField = 'createdById') {
        switch (scope) {
            case client_1.PermissionScope.OWN:
                return { [ownerField]: user.id, companyId: user.companyId };
            case client_1.PermissionScope.TEAM:
                if (!user.teamId) {
                    return { [ownerField]: user.id, companyId: user.companyId };
                }
                return { teamId: user.teamId, companyId: user.companyId };
            case client_1.PermissionScope.DEPARTMENT:
                if (!user.departmentId) {
                    return { [ownerField]: user.id, companyId: user.companyId };
                }
                return { departmentId: user.departmentId, companyId: user.companyId };
            case client_1.PermissionScope.COMPANY:
            case client_1.PermissionScope.OWNER_ONLY:
                return { companyId: user.companyId };
            default:
                return { [ownerField]: user.id, companyId: user.companyId };
        }
    }
    buildEffectiveFilter(scope, user, options = {}) {
        const { ownerField = 'assignedToEmployeeId', employeeRelation = 'employees' } = options;
        const base = { companyId: user.companyId };
        switch (scope) {
            case client_1.PermissionScope.OWN:
                if (user.employeeId) {
                    return { ...base, [ownerField]: user.employeeId };
                }
                return base;
            case client_1.PermissionScope.TEAM:
                if (!user.teamId) {
                    if (user.employeeId)
                        return { ...base, [ownerField]: user.employeeId };
                    return base;
                }
                return { ...base, [employeeRelation]: { teamId: user.teamId } };
            case client_1.PermissionScope.DEPARTMENT:
                if (!user.departmentId) {
                    if (user.employeeId)
                        return { ...base, [ownerField]: user.employeeId };
                    return base;
                }
                return { ...base, [employeeRelation]: { departmentId: user.departmentId } };
            case client_1.PermissionScope.COMPANY:
            case client_1.PermissionScope.OWNER_ONLY:
                return base;
            default:
                if (user.employeeId)
                    return { ...base, [ownerField]: user.employeeId };
                return base;
        }
    }
};
exports.ScopeService = ScopeService;
exports.ScopeService = ScopeService = __decorate([
    (0, common_1.Injectable)()
], ScopeService);
//# sourceMappingURL=scope.service.js.map