import { Injectable, ConsoleLogger } from '@nestjs/common';
import { createWriteStream, WriteStream } from 'fs';
import { join } from 'path';

@Injectable()
export class LoggerService extends ConsoleLogger {
  private infoStream: WriteStream;
  private errorStream: WriteStream;

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

  log(message: any, context?: string) {
    this.safeWrite(this.infoStream, this.buildLogLine(message, context) + '\n');
    super.log(message, context);
  }

  error(message: any, stack?: string, context?: string) {
    this.safeWrite(
      this.errorStream,
      this.buildLogLine(message, context) + '\n',
    );
    if (stack) {
      this.safeWrite(
        this.errorStream,
        `${new Date().toISOString()} STACK: ${stack}\n`,
      );
    }
    super.error(message, stack, context);
  }

  warn(message: any, context?: string) {
    this.safeWrite(this.infoStream, this.buildLogLine(message, context) + '\n');
    super.warn(message, context);
  }

  requestLog(
    method: string,
    url: string,
    statusCode: number,
    durationMs: number,
  ) {
    this.safeWrite(
      this.infoStream,
      `${new Date().toISOString()} ${method} ${url} ${statusCode} ${durationMs}ms\n`,
    );
  }
}
