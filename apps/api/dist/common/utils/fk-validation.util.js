"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateForeignKey = validateForeignKey;
const common_1 = require("@nestjs/common");
async function validateForeignKey(prisma, model, where, label) {
    const exists = await prisma[model].findFirst({ where });
    if (!exists) {
        throw new common_1.NotFoundException(`${label} not found`);
    }
}
//# sourceMappingURL=fk-validation.util.js.map