"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataScope = void 0;
exports.getDataScope = getDataScope;
exports.isOwnDataScope = isOwnDataScope;
exports.getScopedEmployeeId = getScopedEmployeeId;
var DataScope;
(function (DataScope) {
    DataScope["ALL"] = "ALL";
    DataScope["TEAM"] = "TEAM";
    DataScope["OWN"] = "OWN";
})(DataScope || (exports.DataScope = DataScope = {}));
const OWN_SCOPE_ROLES = new Set([
    'EMPLOYEE',
    'FIELD_EMPLOYEE',
]);
function getDataScope(role) {
    if (OWN_SCOPE_ROLES.has(role)) {
        return DataScope.OWN;
    }
    return DataScope.ALL;
}
function isOwnDataScope(role) {
    return getDataScope(role) === DataScope.OWN;
}
function getScopedEmployeeId(role, employeeId) {
    if (isOwnDataScope(role) && employeeId) {
        return employeeId;
    }
    return undefined;
}
//# sourceMappingURL=role-scope.util.js.map