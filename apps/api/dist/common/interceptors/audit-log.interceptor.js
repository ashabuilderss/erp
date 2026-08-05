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
var AuditLogInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const prisma_service_1 = require("../../config/prisma.service");
const SKIP_PATHS = ['/auth/login', '/auth/refresh', '/health'];
const ENTITY_MAP = {
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
const ENTITY_TO_PRISMA = {
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
const ACTIONS = {
    POST: 'Created',
    PATCH: 'Updated',
    PUT: 'Updated',
    DELETE: 'Deleted',
};
function looksLikeId(segment) {
    return (/^[a-z][a-z0-9]{24}$/.test(segment) ||
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(segment));
}
function detectEntity(path) {
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
function extractId(result, fallback) {
    if (result && typeof result === 'object') {
        const obj = result;
        if (obj.id && typeof obj.id === 'string')
            return obj.id;
        if (obj.data && typeof obj.data === 'object') {
            const data = obj.data;
            if (data.id && typeof data.id === 'string')
                return data.id;
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
function redactSensitiveFields(data) {
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
        if (SENSITIVE_AUDIT_FIELDS.has(key)) {
            cleaned[key] = '[REDACTED]';
        }
        else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            cleaned[key] = redactSensitiveFields(value);
        }
        else {
            cleaned[key] = value;
        }
    }
    return cleaned;
}
function extractAfterValues(result) {
    if (!result || typeof result !== 'object')
        return null;
    const obj = result;
    const data = obj.data || obj;
    if (data && typeof data === 'object') {
        return redactSensitiveFields(data);
    }
    return null;
}
let AuditLogInterceptor = AuditLogInterceptor_1 = class AuditLogInterceptor {
    prisma;
    logger = new common_1.Logger(AuditLogInterceptor_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const { method, path, user, ip, headers } = request;
        if (method === 'GET' || !user?.id)
            return next.handle();
        if (SKIP_PATHS.some((p) => path.startsWith(p)))
            return next.handle();
        const requestId = headers?.['x-request-id'] || headers?.['x-correlation-id'] || '';
        const ipAddress = ip || headers?.['x-forwarded-for'] || headers?.['x-real-ip'] || '';
        const { entityType, entityId: urlEntityId } = detectEntity(path);
        const entityId = urlEntityId;
        const action = this.describeAction(method, entityType, entityId);
        const actorEmail = user.email || '';
        const actorName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        const actorRole = user.role || '';
        const employeeLookup = (0, rxjs_1.from)(this.prisma.employee
            .findUnique({ where: { userId: user.id } })
            .catch(() => null));
        return employeeLookup.pipe((0, operators_1.mergeMap)((employee) => {
            const performedById = employee?.id ?? null;
            return (0, rxjs_1.from)(this.captureBeforeState(entityType, entityId)).pipe((0, operators_1.map)((beforeValues) => ({
                performedById,
                beforeValues,
            })), (0, operators_1.catchError)(() => (0, rxjs_1.of)({ performedById, beforeValues: null })));
        }), (0, operators_1.mergeMap)(({ performedById, beforeValues }) => {
            return next.handle().pipe((0, operators_1.mergeMap)((result) => {
                const resolvedId = extractId(result, entityId);
                const afterValues = extractAfterValues(result);
                return (0, rxjs_1.from)(this.saveAuditLog({
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
                })).pipe((0, operators_1.map)(() => result), (0, operators_1.catchError)((e) => {
                    this.logger.error(`Failed to save audit log: ${e.message}`, e.stack);
                    return (0, rxjs_1.of)(result);
                }));
            }), (0, operators_1.catchError)((error) => {
                return (0, rxjs_1.from)(this.saveAuditLog({
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
                })).pipe((0, operators_1.map)(() => { throw error; }), (0, operators_1.catchError)((e) => {
                    this.logger.error(`Failed to save failure audit log: ${e.message}`, e.stack);
                    return (0, rxjs_1.throwError)(() => error);
                }));
            }));
        }), (0, operators_1.catchError)((err) => {
            this.logger.error(`Audit interceptor setup failed: ${err.message}`, err.stack);
            return next.handle();
        }));
    }
    describeAction(method, entityType, entityId) {
        const action = ACTIONS[method] || method;
        if (entityId && entityId.length > 0 && entityId.length < 30) {
            return `${action} ${entityType} ${entityId}`;
        }
        return `${action} ${entityType}`;
    }
    async captureBeforeState(entityType, entityId) {
        if (!entityId || entityId.length < 10)
            return null;
        const prismaModel = ENTITY_TO_PRISMA[entityType];
        if (!prismaModel)
            return null;
        try {
            const record = await this.prisma[prismaModel].findUnique({
                where: { id: entityId },
            });
            return record ? redactSensitiveFields(JSON.parse(JSON.stringify(record))) : null;
        }
        catch {
            return null;
        }
    }
    async saveAuditLog(data) {
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
};
exports.AuditLogInterceptor = AuditLogInterceptor;
exports.AuditLogInterceptor = AuditLogInterceptor = AuditLogInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditLogInterceptor);
//# sourceMappingURL=audit-log.interceptor.js.map