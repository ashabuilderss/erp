"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEffectiveScopeFilter = getEffectiveScopeFilter;
exports.getDirectScopeFilter = getDirectScopeFilter;
const client_1 = require("@prisma/client");
function getEffectiveScopeFilter(scopes, permissionName, user, options = {}) {
    const { ownerField = 'assignedToEmployeeId', employeeRelation = 'employees' } = options;
    const base = { companyId: user.companyId };
    const scope = scopes?.[permissionName] ?? client_1.PermissionScope.COMPANY;
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
function getDirectScopeFilter(scopes, permissionName, user, ownerField = 'id') {
    const scope = scopes?.[permissionName] ?? client_1.PermissionScope.COMPANY;
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
            return { ...base, teamId: user.teamId };
        case client_1.PermissionScope.DEPARTMENT:
            if (!user.departmentId) {
                if (user.employeeId)
                    return { ...base, [ownerField]: user.employeeId };
                return base;
            }
            return { ...base, departmentId: user.departmentId };
        case client_1.PermissionScope.COMPANY:
        case client_1.PermissionScope.OWNER_ONLY:
            return base;
        default:
            if (user.employeeId)
                return { ...base, [ownerField]: user.employeeId };
            return base;
    }
}
//# sourceMappingURL=scope-helper.util.js.map