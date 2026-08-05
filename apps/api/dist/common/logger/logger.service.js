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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerService = void 0;
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const path_1 = require("path");
const client_cloudwatch_logs_1 = require("@aws-sdk/client-cloudwatch-logs");
let LoggerService = class LoggerService extends common_1.ConsoleLogger {
    infoStream;
    errorStream;
    cwClient = null;
    logGroupName = 'AshaBuilders-ERP-Prod';
    logStreamName = `api-${new Date().toISOString().split('T')[0]}`;
    cwSequenceToken = undefined;
    constructor() {
        super();
        const logDir = process.cwd();
        this.infoStream = (0, fs_1.createWriteStream)((0, path_1.join)(logDir, 'api.log'), {
            flags: 'a',
        });
        this.errorStream = (0, fs_1.createWriteStream)((0, path_1.join)(logDir, 'api.err.log'), {
            flags: 'a',
        });
        this.infoStream.on('error', () => { });
        this.errorStream.on('error', () => { });
        const region = process.env.AWS_REGION || process.env.S3_REGION || 'ap-south-1';
        const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID;
        const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY;
        if (process.env.NODE_ENV === 'production' && accessKeyId && secretAccessKey) {
            this.cwClient = new client_cloudwatch_logs_1.CloudWatchLogsClient({
                region,
                credentials: { accessKeyId, secretAccessKey },
            });
        }
    }
    buildLogLine(message, context) {
        const ctx = context ? ` [${context}]` : '';
        return `${new Date().toISOString()}${ctx} ${message}`;
    }
    safeWrite(stream, data) {
        try {
            stream.write(data);
        }
        catch {
        }
    }
    async pushToCloudWatch(message) {
        if (!this.cwClient)
            return;
        try {
            const command = new client_cloudwatch_logs_1.PutLogEventsCommand({
                logGroupName: this.logGroupName,
                logStreamName: this.logStreamName,
                logEvents: [
                    {
                        message,
                        timestamp: Date.now(),
                    },
                ],
                sequenceToken: this.cwSequenceToken,
            });
            const response = await this.cwClient.send(command);
            this.cwSequenceToken = response.nextSequenceToken;
        }
        catch (err) {
        }
    }
    log(message, context) {
        const line = this.buildLogLine(message, context);
        this.safeWrite(this.infoStream, line + '\n');
        this.pushToCloudWatch(line);
        super.log(message, context);
    }
    error(message, stack, context) {
        const line = this.buildLogLine(message, context);
        this.safeWrite(this.errorStream, line + '\n');
        let cwMsg = line;
        if (stack) {
            const stackLine = `${new Date().toISOString()} STACK: ${stack}`;
            this.safeWrite(this.errorStream, stackLine + '\n');
            cwMsg += '\n' + stackLine;
        }
        this.pushToCloudWatch(cwMsg);
        super.error(message, stack, context);
    }
    warn(message, context) {
        const line = this.buildLogLine(message, context);
        this.safeWrite(this.infoStream, line + '\n');
        this.pushToCloudWatch(line);
        super.warn(message, context);
    }
    requestLog(method, url, statusCode, durationMs) {
        const line = `${new Date().toISOString()} ${method} ${url} ${statusCode} ${durationMs}ms`;
        this.safeWrite(this.infoStream, line + '\n');
        this.pushToCloudWatch(line);
    }
};
exports.LoggerService = LoggerService;
exports.LoggerService = LoggerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], LoggerService);
//# sourceMappingURL=logger.service.js.map