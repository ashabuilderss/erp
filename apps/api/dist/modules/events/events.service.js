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
var EventsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const realtime_gateway_1 = require("../../common/realtime/realtime.gateway");
let EventsService = EventsService_1 = class EventsService {
    realtimeGateway;
    logger = new common_1.Logger(EventsService_1.name);
    constructor(realtimeGateway) {
        this.realtimeGateway = realtimeGateway;
    }
    push(companyId, event, entityType, payload) {
        this.realtimeGateway.broadcastToCompany(companyId, event, {
            event,
            entityType,
            ...(payload ? { payload } : {}),
        });
    }
    handleCreate(payload) {
        this.push(payload.companyId, 'created', '');
    }
    handleUpdate(payload) {
        this.push(payload.companyId, 'updated', '');
    }
    handleDelete(payload) {
        this.push(payload.companyId, 'deleted', '');
    }
};
exports.EventsService = EventsService;
__decorate([
    (0, event_emitter_1.OnEvent)('*.created'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EventsService.prototype, "handleCreate", null);
__decorate([
    (0, event_emitter_1.OnEvent)('*.updated'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EventsService.prototype, "handleUpdate", null);
__decorate([
    (0, event_emitter_1.OnEvent)('*.deleted'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EventsService.prototype, "handleDelete", null);
exports.EventsService = EventsService = EventsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [realtime_gateway_1.RealtimeGateway])
], EventsService);
//# sourceMappingURL=events.service.js.map