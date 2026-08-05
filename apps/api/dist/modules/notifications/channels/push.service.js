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
var PushService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushService = void 0;
const common_1 = require("@nestjs/common");
const app_1 = require("firebase-admin/app");
const messaging_1 = require("firebase-admin/messaging");
let PushService = PushService_1 = class PushService {
    logger = new common_1.Logger(PushService_1.name);
    initialized = false;
    constructor() {
        const credentialsPath = process.env.FCM_CREDENTIALS_PATH;
        const serverKey = process.env.FCM_SERVER_KEY;
        try {
            if (credentialsPath) {
                const serviceAccount = require(credentialsPath);
                (0, app_1.initializeApp)({ credential: (0, app_1.cert)(serviceAccount) });
                this.initialized = true;
                this.logger.log('FCM initialized via service account');
            }
            else if (serverKey) {
                (0, app_1.initializeApp)({ credential: (0, app_1.applicationDefault)() });
                this.initialized = true;
                this.logger.log('FCM initialized via application default');
            }
            else {
                this.logger.warn('FCM not configured — push notifications disabled');
            }
        }
        catch (err) {
            this.logger.warn('FCM init failed', err);
        }
    }
    async send(params) {
        if (!this.initialized) {
            this.logger.warn(`Push not sent (no FCM): ${params.title}`);
            return false;
        }
        try {
            await (0, messaging_1.getMessaging)().send({
                token: params.token,
                notification: { title: params.title, body: params.body },
                data: params.data,
            });
            this.logger.log(`Push sent: ${params.title}`);
            return true;
        }
        catch (err) {
            this.logger.error(`Push failed: ${params.title}`, err);
            return false;
        }
    }
};
exports.PushService = PushService;
exports.PushService = PushService = PushService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PushService);
//# sourceMappingURL=push.service.js.map