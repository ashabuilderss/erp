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
var WarningThresholdBreachedListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarningThresholdBreachedListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const hold_recommendation_service_1 = require("./hold-recommendation.service");
const events_1 = require("../governance-events/types/events");
const client_1 = require("@prisma/client");
let WarningThresholdBreachedListener = WarningThresholdBreachedListener_1 = class WarningThresholdBreachedListener {
    recommendationService;
    logger = new common_1.Logger(WarningThresholdBreachedListener_1.name);
    constructor(recommendationService) {
        this.recommendationService = recommendationService;
    }
    async handleWarningThresholdBreached(event) {
        this.logger.log(`Processing WARNING_THRESHOLD_BREACHED for Employee ID ${event.entityId}`);
        try {
            const payload = event.payload;
            await this.recommendationService.createRecommendation(payload.companyId, null, {
                employeeId: payload.employeeId,
                source: 'WARNING_ENGINE',
                sourceId: payload.warningId,
                holdType: client_1.PayrollHoldType.FULL_HOLD,
                reason: payload.reason || 'Disciplinary review threshold breached',
            });
            this.logger.log(`Recommended payroll hold for Employee ID ${event.entityId}`);
        }
        catch (error) {
            this.logger.error(`Failed to recommend hold for WARNING_THRESHOLD_BREACHED: ${error.message}`);
        }
    }
};
exports.WarningThresholdBreachedListener = WarningThresholdBreachedListener;
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.WARNING_THRESHOLD_BREACHED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WarningThresholdBreachedListener.prototype, "handleWarningThresholdBreached", null);
exports.WarningThresholdBreachedListener = WarningThresholdBreachedListener = WarningThresholdBreachedListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [hold_recommendation_service_1.HoldRecommendationService])
], WarningThresholdBreachedListener);
//# sourceMappingURL=warning-threshold-breached.listener.js.map