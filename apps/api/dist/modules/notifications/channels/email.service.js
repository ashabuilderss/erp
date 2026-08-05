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
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const client_ses_1 = require("@aws-sdk/client-ses");
let EmailService = EmailService_1 = class EmailService {
    logger = new common_1.Logger(EmailService_1.name);
    sesClient = null;
    defaultFrom;
    constructor() {
        this.defaultFrom = process.env.SES_FROM_EMAIL || process.env.SMTP_FROM || 'noreply@ashabuilders.com';
        const region = process.env.AWS_REGION || process.env.S3_REGION || 'ap-south-1';
        const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID;
        const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY;
        if (accessKeyId && secretAccessKey) {
            this.sesClient = new client_ses_1.SESClient({
                region,
                credentials: {
                    accessKeyId,
                    secretAccessKey,
                },
            });
            this.logger.log('AWS SES Email service initialized');
        }
        else {
            this.logger.warn('AWS SES credentials not configured — email sending disabled');
        }
    }
    async send(params) {
        if (!this.sesClient) {
            this.logger.warn(`Email not sent (SES disabled): ${params.subject} -> ${params.to}`);
            return false;
        }
        try {
            const command = new client_ses_1.SendEmailCommand({
                Source: this.defaultFrom,
                Destination: {
                    ToAddresses: [params.to],
                },
                Message: {
                    Subject: { Data: params.subject, Charset: 'UTF-8' },
                    Body: {
                        Html: { Data: params.html, Charset: 'UTF-8' },
                    },
                },
            });
            await this.sesClient.send(command);
            this.logger.log(`Email sent via SES: ${params.subject} -> ${params.to}`);
            return true;
        }
        catch (err) {
            this.logger.error(`Email failed (SES): ${params.subject} -> ${params.to}`, err);
            return false;
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EmailService);
//# sourceMappingURL=email.service.js.map