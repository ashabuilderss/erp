import { ConsoleLogger } from '@nestjs/common';
export declare class LoggerService extends ConsoleLogger {
    private infoStream;
    private errorStream;
    private cwClient;
    private readonly logGroupName;
    private readonly logStreamName;
    private cwSequenceToken;
    constructor();
    private buildLogLine;
    private safeWrite;
    private pushToCloudWatch;
    log(message: any, context?: string): void;
    error(message: any, stack?: string, context?: string): void;
    warn(message: any, context?: string): void;
    requestLog(method: string, url: string, statusCode: number, durationMs: number): void;
}
