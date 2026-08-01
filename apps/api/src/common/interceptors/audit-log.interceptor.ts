import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, from, of, throwError } from 'rxjs';
import { mergeMap, map, catchError } from 'rxjs/operators';
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
  return (
    /^[a-z][a-z0-9]{24}$/.test(segment) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
      segment,
    )
  );
}

function detectEntity(path: string): { entityType: string; entityId: string } {
  const parts = path
    .split('/')
    .filter(Boolean)
    .filter((p) => p !== 'api');
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

const SENSITIVE_AUDIT_FIELDS = new Set([
  'password',
  'hashedPassword',
  'confirmPassword',
  'currentPassword',
  'newPassword',
  'totpSecret',
  'backupCodes',
  'secret',
  'encryptionKey',
  'authSecret',
  'token',
]);

function redactSensitiveFields(data: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_AUDIT_FIELDS.has(key)) {
      cleaned[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      cleaned[key] = redactSensitiveFields(value as Record<string, unknown>);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

function extractAfterValues(result: unknown): Record<string, unknown> | null {
  if (!result || typeof result !== 'object') return null;
  const obj = result as Record<string, unknown>;
  const data = obj.data || obj;
  if (data && typeof data === 'object') {
    return redactSensitiveFields(data as Record<string, unknown>);
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

    const requestId =
      headers?.['x-request-id'] || headers?.['x-correlation-id'] || '';
    const ipAddress =
      ip || headers?.['x-forwarded-for'] || headers?.['x-real-ip'] || '';
    const { entityType, entityId: urlEntityId } = detectEntity(path);
    const entityId = urlEntityId;
    const action = this.describeAction(method, entityType, entityId);
    const actorEmail = user.email || '';
    const actorName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    const actorRole = user.role || '';

    const employeeLookup = from(
      this.prisma.employee
        .findUnique({ where: { userId: user.id } })
        .catch(() => null),
    );

    return employeeLookup.pipe(
      mergeMap((employee) => {
        const performedById = employee?.id ?? null;

        return from(this.captureBeforeState(entityType, entityId)).pipe(
          map((beforeValues) => ({
            performedById,
            beforeValues,
          })),
          catchError(() => of({ performedById, beforeValues: null })),
        );
      }),
      mergeMap(({ performedById, beforeValues }) => {
        return next.handle().pipe(
          mergeMap((result) => {
            const resolvedId = extractId(result, entityId);
            const afterValues = extractAfterValues(result);
            return from(this.saveAuditLog({
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
            })).pipe(
              map(() => result),
              catchError((e) => {
                this.logger.error(`Failed to save audit log: ${e.message}`, e.stack);
                return of(result);
              }),
            );
          }),
          catchError((error) => {
            return from(this.saveAuditLog({
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
            })).pipe(
              map(() => { throw error; }),
              catchError((e) => {
                this.logger.error(`Failed to save failure audit log: ${e.message}`, e.stack);
                return throwError(() => error);
              }),
            );
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
      return record ? redactSensitiveFields(JSON.parse(JSON.stringify(record)) as Record<string, unknown>) : null;
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
