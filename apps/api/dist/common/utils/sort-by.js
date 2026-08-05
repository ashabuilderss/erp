"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeSortBy = safeSortBy;
function safeSortBy(sortBy, allowedFields, defaultField) {
    if (sortBy && allowedFields.includes(sortBy)) {
        return sortBy;
    }
    return defaultField;
}
//# sourceMappingURL=sort-by.js.map