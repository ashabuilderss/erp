import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, from, of, throwError } from 'rxjs';
import { mergeMap, map, catchError, tap } from 'rxjs/operators';
import { PrismaService } from '../../config/prisma.service';

const SKIP_PATHS = ['/auth/login', '/auth/refresh', '/health'];
const ENTITY_MAP: Record<string, string> = {
  properties: 'Property',
  leads: 'Lead',
  customers: 'Customer',
  'site-visits': 'SiteVisit',
  bookings: 'Booking',
  employees: 'Employee',
  attendance: 'Attendance',
  'leave-requests': 'LeaveRequest',
  'leave-allocations': 'LeaveAllocation',
  departments: 'Department',
  designations: 'Designation',
  users: 'User',
  assignments: 'EmployeeAssignment',
  performance: 'Performance',
  notifications: 'Notification',
  companies: 'Company',
  'construction-sites': 'ConstructionSite',
  vendors: 'Vendor',
  brokers: 'Broker',
  dealers: 'Dealer',
  complaints: 'Complaint',
  incentives: 'Incentive',
  commissions: 'PipelineCommission',
  'payment-schedules': 'PaymentSchedule',
  'payment-entries': 'PaymentEntry',
  'expense-claims': 'ExpenseClaim',
};

const ENTITY_TO_PRISMA: Record<string, string> = {
  Property: 'property',
  Lead: 'lead',
  Customer: 'customer',
  SiteVisit: 'siteVisit',
  Booking: 'booking',
  Employee: 'employee',
  Attendance: 'attendance',
  LeaveRequest: 'leaveRequest',
  LeaveAllocation: 'leaveAllocation',
  Department: 'department',
  Designation: 'designation',
  User: 'user',
  EmployeeAssignment: 'employeeAssignment',
  Performance: 'performance',
  Notification: 'notification',
  Company: 'company',
  ConstructionSite: 'constructionSite',
  Vendor: 'vendor',
  Broker: 'broker',
  Dealer: 'dealer',
  Complaint: 'complaint',
  Incentive: 'incentive',
  PipelineCommission: 'pipelineCommission',
  PaymentSchedule: 'paymentSchedule',
  PaymentEntry: 'paymentEntry',
  ExpenseClaim: 'expenseClaim',
};

const ACTIONS: Record<string, string> = {
  POST: 'Created',
  PATCH: 'Updated',
  PUT: 'Updated',
  DELETE: 'Deleted',
};

function looksLikeId(segment: string): boolean {
  return /^[a-z][a-z0-9]{24}$/.test(segment) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(segment);
}

function detectEntity(path: string): { entityType: string; entityId: string } {
  const parts = path.split('/').filter(Boolean).filter((p) => p !== 'api');
  let entityType = 'unknown';
  let entityId = 'unknown';

  for (let i = 0; i < parts.length; i++) {
    if (ENTITY_MAP[parts[i]]) {
      entityType = ENTITY_MAP[parts[i]];
      if (i + 1 < parts.length && looksLikeId(parts[i + 1])) {
        entityId = parts[i + 1];
      }
      break;
    }
  }

  if (entityType === 'unknown') {
    entityType = parts[0] || 'unknown';
    entityId = parts[parts.length - 1] || 'unknown';
  }

  return { entityType, entityId };
}

function extractId(result: unknown, fallback: string): string {
  if (result && typeof result === 'object') {
    const obj = result as Record<string, unknown>;
    if (obj.id && typeof obj.id === 'string') return obj.id;
    if (obj.data && typeof obj.data === 'object') {
      const data = obj.data as Record<string, unknown>;
      if (data.id && typeof data.id === 'string') return data.id;
    }
  }
  return fallback;
}

function extractAfterValues(result: unknown): Record<string, unknown> | null {
  if (!result || typeof result !== 'object') return null;
  const obj = result as Record<string, unknown>;
  const data = obj.data || obj;
  if (data && typeof data === 'object') {
    const cleaned = { ...data as Record<string, unknown> };
    return cleaned;
  }
  return null;
}

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, path, user, ip, headers } = request;

    if (method === 'GET' || !user?.id) return next.handle();
    if (SKIP_PATHS.some((p) => path.startsWith(p))) return next.handle();

    const requestId = headers?.['x-request-id']
      || headers?.['x-correlation-id']
      || '';
    const ipAddress = ip
      || headers?.['x-forwarded-for']
      || headers?.['x-real-ip']
      || '';
    const { entityType, entityId: urlEntityId } = detectEntity(path);
    const entityId = urlEntityId;
    const action = this.describeAction(method, entityType, entityId);
    const actorEmail = user.email || '';
    const actorName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    const actorRole = user.role || '';

    const employeeLookup = from(
      this.prisma.employee.findUnique({ where: { userId: user.id } })
        .catch(() => null),
    );

    return employeeLookup.pipe(
      mergeMap((employee) => {
        const performedById = employee?.id ?? null;

        return from(this.captureBeforeState(entityType, entityId)).pipe(
          map((beforeValues) => ({
            performedById, beforeValues,
          })),
          catchError(() => of({ performedById, beforeValues: null })),
        );
      }),
      mergeMap(({ performedById, beforeValues }) => {
        return next.handle().pipe(
          tap((result) => {
            const resolvedId = extractId(result, entityId);
            const afterValues = extractAfterValues(result);
            this.saveAuditLog({
              action,
              entityType,
              entityId: resolvedId,
              description: action,
              performedById,
              companyId: user.companyId,
              actorEmail,
              actorName,
              actorRole,
              ipAddress,
              requestId,
              beforeValues,
              afterValues,
              metadata: { method, path },
            }).catch((e) => this.logger.error(
              `Failed to save audit log: ${e.message}`,
              e.stack,
            ));
          }),
          catchError((error) => {
            this.saveAuditLog({
              action: `${action} (FAILED)`,
              entityType,
              entityId,
              description: `${action} failed: ${error.message}`,
              performedById,
              companyId: user.companyId,
              actorEmail,
              actorName,
              actorRole,
              ipAddress,
              requestId,
              beforeValues,
              metadata: { method, path, error: error.message },
            }).catch((e) => this.logger.error(
              `Failed to save failure audit log: ${e.message}`,
              e.stack,
            ));
            return throwError(() => error);
          }),
        );
      }),
      catchError((err) => {
        this.logger.error(
          `Audit interceptor setup failed: ${err.message}`,
          err.stack,
        );
        return next.handle();
      }),
    );
  }

  private describeAction(
    method: string,
    entityType: string,
    entityId: string,
  ): string {
    const action = ACTIONS[method] || method;
    if (entityId && entityId.length > 0 && entityId.length < 30) {
      return `${action} ${entityType} ${entityId}`;
    }
    return `${action} ${entityType}`;
  }

  private async captureBeforeState(
    entityType: string,
    entityId: string,
  ): Promise<Record<string, unknown> | null> {
    if (!entityId || entityId.length < 10) return null;
    const prismaModel = ENTITY_TO_PRISMA[entityType];
    if (!prismaModel) return null;

    try {
      const record = await (this.prisma as any)[prismaModel].findUnique({
        where: { id: entityId },
      });
      return record ? JSON.parse(JSON.stringify(record)) : null;
    } catch {
      return null;
    }
  }

  private async saveAuditLog(data: {
    action: string;
    entityType: string;
    entityId: string;
    description: string;
    performedById: string | null;
    companyId: string;
    actorEmail: string;
    actorName: string;
    actorRole: string;
    ipAddress: string;
    requestId: string;
    beforeValues?: any;
    afterValues?: any;
    metadata: any;
  }): Promise<void> {
    await this.prisma.activityLog.create({
      data: {
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        description: data.description,
        performedById: data.performedById,
        companyId: data.companyId,
        actorEmail: data.actorEmail || null,
        actorName: data.actorName || null,
        actorRole: data.actorRole || null,
        ipAddress: data.ipAddress || null,
        requestId: data.requestId || null,
        beforeValues: data.beforeValues ?? undefined,
        afterValues: data.afterValues ?? undefined,
        metadata: data.metadata,
      },
    });
  }
}
