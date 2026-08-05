"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeletionLogService = void 0;
const common_1 = require("@nestjs/common");
let DeletionLogService = class DeletionLogService {
    async log(input) {
        await input.tx.deletionLog.create({
            data: {
                companyId: input.companyId,
                entityType: input.entityType,
                entityId: input.entityId,
                userId: input.userId,
                reason: input.reason,
                approvalId: input.approvalId ?? null,
                previousState: input.previousState ?? undefined,
            },
        });
    }
};
exports.DeletionLogService = DeletionLogService;
exports.DeletionLogService = DeletionLogService = __decorate([
    (0, common_1.Injectable)()
], DeletionLogService);
//# sourceMappingURL=deletion-log.service.js.map