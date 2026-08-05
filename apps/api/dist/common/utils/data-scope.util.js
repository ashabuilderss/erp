"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataScope = void 0;
exports.getDataScope = getDataScope;
var DataScope;
(function (DataScope) {
    DataScope["ALL"] = "ALL";
    DataScope["TEAM"] = "TEAM";
    DataScope["OWN"] = "OWN";
})(DataScope || (exports.DataScope = DataScope = {}));
function getDataScope(role) {
    const upperRole = role.toUpperCase();
    if (upperRole === 'OWNER' || upperRole === 'ADMIN')
        return DataScope.ALL;
    if (upperRole === 'MANAGER' ||
        upperRole === 'TEAM_LEAD' ||
        upperRole === 'HR_MANAGER')
        return DataScope.TEAM;
    return DataScope.OWN;
}
//# sourceMappingURL=data-scope.util.js.map