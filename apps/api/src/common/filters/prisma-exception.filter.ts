import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    switch (exception.code) {
      case 'P2002': {
        status = HttpStatus.CONFLICT;
        const target = (exception.meta?.target as string[]) ?? [];
        message = target.length
          ? `Duplicate value for: ${target.join(', ')}`
          : 'A record with this value already exists';
        break;
      }
      case 'P2025': {
        status = HttpStatus.NOT_FOUND;
        message = (exception.meta?.cause as string) ?? 'Record not found';
        break;
      }
      case 'P2003': {
        status = HttpStatus.BAD_REQUEST;
        message = 'Related record not found. Check your references.';
        break;
      }
      case 'P2014': {
        status = HttpStatus.BAD_REQUEST;
        message = 'This operation requires a related record that is missing.';
        break;
      }
      case 'P2000': {
        status = HttpStatus.BAD_REQUEST;
        message = 'Input data is too long for the database column.';
        break;
      }
      case 'P2006': {
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid value provided for a database field.';
        break;
      }
      case 'P2011': {
        status = HttpStatus.BAD_REQUEST;
        message = 'A required field was left empty.';
        break;
      }
      case 'P2012': {
        status = HttpStatus.BAD_REQUEST;
        message = 'Missing required value.';
        break;
      }
      default: {
        this.logger.error(
          `Unhandled Prisma error: ${exception.code} - ${exception.message}`,
        );
        break;
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
