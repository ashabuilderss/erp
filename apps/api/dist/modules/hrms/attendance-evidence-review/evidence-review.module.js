"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvidenceReviewModule = void 0;
const common_1 = require("@nestjs/common");
const evidence_review_service_1 = require("./evidence-review.service");
const evidence_review_controller_1 = require("./evidence-review.controller");
const attendance_module_1 = require("../attendance/attendance.module");
const governance_events_module_1 = require("../../governance-events/governance-events.module");
const storage_module_1 = require("../../uploads/storage/storage.module");
let EvidenceReviewModule = class EvidenceReviewModule {
};
exports.EvidenceReviewModule = EvidenceReviewModule;
exports.EvidenceReviewModule = EvidenceReviewModule = __decorate([
    (0, common_1.Module)({
        imports: [attendance_module_1.AttendanceModule, governance_events_module_1.GovernanceEventsModule, storage_module_1.StorageModule],
        controllers: [evidence_review_controller_1.EvidenceReviewController],
        providers: [evidence_review_service_1.EvidenceReviewService],
        exports: [evidence_review_service_1.EvidenceReviewService],
    })
], EvidenceReviewModule);
//# sourceMappingURL=evidence-review.module.js.map