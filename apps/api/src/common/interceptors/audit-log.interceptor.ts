import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, from, of } from 'rxjs';
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
};

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const { method, path, user } = request;

    if (method === 'GET' || !user?.id) return next.handle();
    if (SKIP_PATHS.some((p) => path.startsWith(p))) return next.handle();

    return from(
      this.prisma.employee.findUnique({ where: { userId: user.id } }),
    ).pipe(
      mergeMap((employee) => {
        if (!employee) return next.handle();

        const pathParts = path
          .split('/')
          .filter(Boolean)
          .filter((p) => p !== 'api');
        const entityType =
          ENTITY_MAP[pathParts[0]] || pathParts[0] || 'unknown';
        const entityId = pathParts[pathParts.length - 1] || 'unknown';
        const action = this.describeAction(method, entityType, entityId);

        return next.handle().pipe(
          mergeMap((result: unknown) => {
            const id = this.extractId(result, entityId);
            return from(
              this.prisma.activityLog.create({
                data: {
                  action,
                  entityType,
                  entityId: id,
                  description: action,
                  performedById: employee.id,
                  companyId: user.companyId,
                  metadata: { method, path },
                },
              }),
            ).pipe(
              map(() => result),
              catchError(() => of(result)),
            );
          }),
          catchError((error: any) => {
            from(
              this.prisma.activityLog.create({
                data: {
                  action: `${action} (FAILED)`,
                  entityType,
                  entityId,
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  description: `${action} failed: ${error.message}`,
                  performedById: employee.id,
                  companyId: user.companyId,
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
                  metadata: { method, path, error: error.message },
                },
              }),
            ).pipe(catchError(() => of(null)));
            throw error;
          }),
        );
      }),
    );
  }

  private describeAction(
    method: string,
    entityType: string,
    entityId: string,
  ): string {
    const actions: Record<string, string> = {
      POST: 'Created',
      PATCH: 'Updated',
      PUT: 'Updated',
      DELETE: 'Deleted',
    };
    const action = actions[method] || method;
    if (entityId && entityId.length > 0 && entityId.length < 30) {
      return `${action} ${entityType} ${entityId}`;
    }
    return `${action} ${entityType}`;
  }

  private extractId(result: unknown, fallback: string): string {
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
}

interface AuthenticatedRequest extends Request {
  method: string;
  path: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    companyId: string;
  };
}
