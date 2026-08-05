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
var DashboardMetricsListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardMetricsListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const events_1 = require("../governance-events/types/events");
const realtime_gateway_1 = require("../../common/realtime/realtime.gateway");
let DashboardMetricsListener = DashboardMetricsListener_1 = class DashboardMetricsListener {
    realtimeGateway;
    logger = new common_1.Logger(DashboardMetricsListener_1.name);
    constructor(realtimeGateway) {
        this.realtimeGateway = realtimeGateway;
    }
    async onAnyDomainEvent(event) {
        const payload = event?.payload;
        const companyId = payload?.companyId;
        if (companyId) {
            this.realtimeGateway.broadcastToOwners(companyId, 'dashboard:update', {
                type: event.eventType,
            });
        }
    }
    async onAttendancePunchRecorded(_event) { }
    async onAttendanceSessionClosed(_event) { }
};
exports.DashboardMetricsListener = DashboardMetricsListener;
__decorate([
    (0, event_emitter_1.OnEvent)('domain.*'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardMetricsListener.prototype, "onAnyDomainEvent", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.ATTENDANCE_PUNCH_RECORDED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardMetricsListener.prototype, "onAttendancePunchRecorded", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.ATTENDANCE_SESSION_CLOSED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardMetricsListener.prototype, "onAttendanceSessionClosed", null);
exports.DashboardMetricsListener = DashboardMetricsListener = DashboardMetricsListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [realtime_gateway_1.RealtimeGateway])
], DashboardMetricsListener);
//# sourceMappingURL=dashboard-metrics.listener.js.map