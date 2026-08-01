import { Injectable, ConsoleLogger } from '@nestjs/common';
import { createWriteStream, WriteStream } from 'fs';
import { join } from 'path';
import { CloudWatchLogsClient, PutLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';

@Injectable()
export class LoggerService extends ConsoleLogger {
  private infoStream: WriteStream;
  private errorStream: WriteStream;
  private cwClient: CloudWatchLogsClient | null = null;
  private readonly logGroupName = 'AshaBuilders-ERP-Prod';
  private readonly logStreamName = `api-${new Date().toISOString().split('T')[0]}`;
  private cwSequenceToken: string | undefined = undefined;

  constructor() {
    super();
    const logDir = process.cwd();
    this.infoStream = createWriteStream(join(logDir, 'api.log'), {
      flags: 'a',
    });
    this.errorStream = createWriteStream(join(logDir, 'api.err.log'), {
      flags: 'a',
    });
    this.infoStream.on('error', () => {});
    this.errorStream.on('error', () => {});

    const region = process.env.AWS_REGION || process.env.S3_REGION || 'ap-south-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY;

    if (process.env.NODE_ENV === 'production' && accessKeyId && secretAccessKey) {
      this.cwClient = new CloudWatchLogsClient({
        region,
        credentials: { accessKeyId, secretAccessKey },
      });
      // We do not await stream creation here to avoid blocking startup.
      // In a real production setup, the stream should exist or be created beforehand,
      // or we handle ResourceNotFoundException and create it on the fly.
    }
  }

  private buildLogLine(message: any, context?: string): string {
    const ctx = context ? ` [${context}]` : '';
    return `${new Date().toISOString()}${ctx} ${message}`;
  }

  private safeWrite(stream: WriteStream, data: string) {
    try {
      stream.write(data);
    } catch {
      // noop
    }
  }

  private async pushToCloudWatch(message: string) {
    if (!this.cwClient) return;

    try {
      const command = new PutLogEventsCommand({
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
    } catch (err: any) {
      // Ignore errors to prevent log loops, or handle ResourceNotFound by creating stream.
    }
  }

  log(message: any, context?: string) {
    const line = this.buildLogLine(message, context);
    this.safeWrite(this.infoStream, line + '\n');
    this.pushToCloudWatch(line);
    super.log(message, context);
  }

  error(message: any, stack?: string, context?: string) {
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

  warn(message: any, context?: string) {
    const line = this.buildLogLine(message, context);
    this.safeWrite(this.infoStream, line + '\n');
    this.pushToCloudWatch(line);
    super.warn(message, context);
  }

  requestLog(
    method: string,
    url: string,
    statusCode: number,
    durationMs: number,
  ) {
    const line = `${new Date().toISOString()} ${method} ${url} ${statusCode} ${durationMs}ms`;
    this.safeWrite(
      this.infoStream,
      line + '\n',
    );
    this.pushToCloudWatch(line);
  }
}
