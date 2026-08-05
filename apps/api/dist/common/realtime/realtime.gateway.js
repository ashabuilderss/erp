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
var RealtimeGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jsonwebtoken_1 = require("jsonwebtoken");
let RealtimeGateway = RealtimeGateway_1 = class RealtimeGateway {
    server;
    logger = new common_1.Logger(RealtimeGateway_1.name);
    async handleConnection(client) {
        const token = client.handshake.auth?.token ||
            client.handshake.headers?.authorization?.split(' ')[1];
        if (!token) {
            this.logger.warn(`Client connect rejected (No token): ${client.id}`);
            client.disconnect(true);
            return;
        }
        try {
            const secret = process.env.AUTH_SECRET;
            if (!secret) {
                this.logger.fatal('AUTH_SECRET is not set. WebSocket authentication cannot proceed.');
                client.disconnect(true);
                return;
            }
            const decoded = (0, jsonwebtoken_1.verify)(token, secret);
            client.data.user = decoded;
            const role = decoded.role;
            client.join(`role:${role}`);
            client.join(`user:${decoded.sub}`);
            if (decoded.companyId) {
                client.join(`company:${decoded.companyId}`);
                client.join(`role:${role}:company:${decoded.companyId}`);
            }
            this.logger.debug(`Client connected: ${client.id} (Role: ${role})`);
        }
        catch (e) {
            this.logger.warn(`Client connect rejected (Invalid token): ${client.id}`);
            client.disconnect(true);
        }
    }
    handleDisconnect(client) {
        this.logger.debug(`Client disconnected: ${client.id}`);
    }
    broadcastToOwners(companyId, eventName, data) {
        this.server.to(`role:OWNER:company:${companyId}`).emit(eventName, data);
    }
    broadcastToUser(userId, eventName, data) {
        this.server.to(`user:${userId}`).emit(eventName, data);
    }
    broadcastToCompany(companyId, eventName, data) {
        this.server.to(`company:${companyId}`).emit(eventName, data);
    }
};
exports.RealtimeGateway = RealtimeGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], RealtimeGateway.prototype, "server", void 0);
exports.RealtimeGateway = RealtimeGateway = RealtimeGateway_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true,
        },
        path: '/api/v1/socket.io',
    })
], RealtimeGateway);
//# sourceMappingURL=realtime.gateway.js.map