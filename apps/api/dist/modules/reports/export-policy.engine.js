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
var ExportPolicyEngine_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportPolicyEngine = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
let ExportPolicyEngine = ExportPolicyEngine_1 = class ExportPolicyEngine {
    prisma;
    logger = new common_1.Logger(ExportPolicyEngine_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async evaluateAndLog(req) {
        const { companyId, userId, userRole, dataset, format, rowCount } = req;
        if (format === 'SHEET' && userRole !== 'OWNER' && userRole !== 'ADMIN') {
            throw new common_1.ForbiddenException(`Google Sheets export is restricted to OWNER/ADMIN roles.`);
        }
        const isSensitive = ['payroll', 'commissions', 'employees'].includes(dataset);
        if (isSensitive &&
            userRole !== 'OWNER' &&
            userRole !== 'ADMIN' &&
            userRole !== 'HR_MANAGER') {
            throw new common_1.ForbiddenException(`Export of sensitive dataset '${dataset}' is restricted.`);
        }
        const MAX_ROWS_NON_OWNER = 1000;
        if (userRole !== 'OWNER' && rowCount > MAX_ROWS_NON_OWNER) {
            throw new common_1.ForbiddenException(`Row limit exceeded. Maximum allowed rows for role ${userRole} is ${MAX_ROWS_NON_OWNER}. Requested: ${rowCount}`);
        }
        if (format === 'CSV' || format === 'SHEET') {
        }
        else if (format === 'PDF') {
        }
    }
};
exports.ExportPolicyEngine = ExportPolicyEngine;
exports.ExportPolicyEngine = ExportPolicyEngine = ExportPolicyEngine_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExportPolicyEngine);
//# sourceMappingURL=export-policy.engine.js.map