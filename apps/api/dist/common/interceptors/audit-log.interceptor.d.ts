import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../config/prisma.service';
export declare class AuditLogInterceptor implements NestInterceptor {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
    private describeAction;
    private captureBeforeState;
    private saveAuditLog;
}
