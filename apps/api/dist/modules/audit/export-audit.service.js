"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportAuditService = void 0;
const common_1 = require("@nestjs/common");
let ExportAuditService = class ExportAuditService {
    async logExport(input) {
        const record = await input.tx.exportLog.create({
            data: {
                companyId: input.companyId,
                exportConfigId: input.exportConfigId ?? null,
                exportType: input.exportType,
                format: input.format,
                requestedById: input.requestedById,
                rowCount: input.rowCount ?? 0,
                isSensitive: input.isSensitive ?? false,
                approvalId: input.approvalId ?? null,
                ipAddress: input.ipAddress ?? null,
                userAgent: input.userAgent ?? null,
            },
        });
        return record.id;
    }
    async logDownload(input) {
        await input.tx.downloadLog.create({
            data: {
                companyId: input.companyId,
                exportLogId: input.exportLogId,
                userId: input.userId,
                fileName: input.fileName ?? null,
                ipAddress: input.ipAddress ?? null,
            },
        });
    }
};
exports.ExportAuditService = ExportAuditService;
exports.ExportAuditService = ExportAuditService = __decorate([
    (0, common_1.Injectable)()
], ExportAuditService);
//# sourceMappingURL=export-audit.service.js.map