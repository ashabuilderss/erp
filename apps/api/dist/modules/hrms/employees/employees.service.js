"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeesService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../../../config/prisma.service");
const transition_service_1 = require("../../../common/services/transition.service");
const client_1 = require("@prisma/client");
const sort_by_1 = require("../../../common/utils/sort-by");
const ALLOWED_SORT = [
    'createdAt',
    'updatedAt',
    'employeeCode',
    'status',
    'dateOfJoining',
];
function normalizeEmployee(emp) {
    if (!emp)
        return emp;
    const result = { ...emp };
    if (result.users !== undefined) {
        result.user = result.users;
        delete result.users;
    }
    if (result.departments !== undefined) {
        result.department = result.departments;
        delete result.departments;
    }
    if (result.designations !== undefined) {
        result.designation = result.designations;
        delete result.designations;
    }
    return result;
}
let EmployeesService = class EmployeesService {
    prisma;
    eventEmitter;
    transitionService;
    constructor(prisma, eventEmitter, transitionService) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
        this.transitionService = transitionService;
    }
    async getMyProfile(userId, role) {
        const employee = await this.prisma.employee.findUnique({
            where: { userId },
            include: {
                users: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                },
                departments: true,
                designations: true,
                employees: {
                    include: {
                        users: {
                            select: {
                                id: true,
                                email: true,
                                firstName: true,
                                lastName: true,
                                role: true,
                            },
                        },
                    },
                },
            },
        });
        if (!employee)
            throw new common_1.NotFoundException('Employee profile not found');
        if (role === client_1.UserRole.EMPLOYEE) {
            const { salary, phone, address, ...safeProfile } = employee;
            return safeProfile;
        }
        return employee;
    }
    DESIGNATION_PREFIXES = {
        'Sales Manager': 'SM',
        'Sales Executive': 'SE',
        'HR Manager': 'HR',
        'Operations Manager': 'OM',
    };
    async generateEmployeeCode(designationId, companyId) {
        const designation = await this.prisma.designation.findUnique({
            where: { id: designationId },
        });
        const prefix = this.DESIGNATION_PREFIXES[designation?.name ?? ''] ?? 'EMP';
        const lastEmployee = await this.prisma.employee.findFirst({
            where: { companyId, employeeCode: { startsWith: `${prefix}-` } },
            orderBy: { createdAt: 'desc' },
            select: { employeeCode: true },
        });
        let nextNum = 1;
        if (lastEmployee?.employeeCode) {
            const match = lastEmployee.employeeCode.match(/(\d+)$/);
            if (match)
                nextNum = parseInt(match[1], 10) + 1;
        }
        return `${prefix}-${String(nextNum).padStart(3, '0')}`;
    }
    async create(dto, companyId) {
        const department = await this.prisma.department.findFirst({
            where: { id: dto.departmentId, companyId },
        });
        if (!department)
            throw new common_1.BadRequestException('Department not found');
        const designation = await this.prisma.designation.findFirst({
            where: { id: dto.designationId, companyId },
        });
        if (!designation)
            throw new common_1.BadRequestException('Designation not found');
        if (dto.managerId) {
            const manager = await this.prisma.employee.findFirst({
                where: { id: dto.managerId, companyId },
            });
            if (!manager)
                throw new common_1.BadRequestException('Manager not found');
        }
        const employeeCode = dto.employeeCode?.trim() ||
            (await this.generateEmployeeCode(dto.designationId, companyId));
        const existingCode = await this.prisma.employee.findUnique({
            where: {
                companyId_employeeCode: { companyId, employeeCode },
            },
        });
        if (existingCode)
            throw new common_1.BadRequestException(`Employee code ${employeeCode} already exists`);
        if (dto.userId) {
            const user = await this.prisma.user.findFirst({
                where: { id: dto.userId, companyId },
            });
            if (!user)
                throw new common_1.BadRequestException(`User with ID ${dto.userId} not found`);
            const existingUser = await this.prisma.employee.findUnique({
                where: { userId: dto.userId },
            });
            if (existingUser)
                throw new common_1.BadRequestException(`User ${dto.userId} already has an employee profile`);
        }
        const employee = await this.prisma.employee.create({
            data: {
                employeeCode,
                userId: dto.userId,
                companyId,
                departmentId: dto.departmentId,
                designationId: dto.designationId,
                managerId: dto.managerId,
                phone: dto.phone,
                dateOfJoining: dto.dateOfJoining ? new Date(dto.dateOfJoining) : null,
                salary: dto.salary ? new client_1.Prisma.Decimal(dto.salary) : null,
                address: dto.address,
                status: dto.status ?? 'ACTIVE',
                staffType: dto.staffType,
            },
            include: {
                users: true,
                departments: true,
                designations: true,
                employees: true,
            },
        });
        this.eventEmitter.emit('employee.created', {
            companyId,
            entityId: employee.id,
        });
        return employee;
    }
    async findAll(query, scopeFilter, role) {
        const { page = 1, limit = 10, search, departmentId, designationId, status, sortBy = 'createdAt', sortOrder = 'desc', } = query;
        const where = {
            companyId: scopeFilter?.companyId ?? '',
            ...scopeFilter,
        };
        if (search) {
            where.OR = [
                { employeeCode: { contains: search, mode: 'insensitive' } },
                { users: { firstName: { contains: search, mode: 'insensitive' } } },
                { users: { lastName: { contains: search, mode: 'insensitive' } } },
                { users: { email: { contains: search, mode: 'insensitive' } } },
            ];
        }
        if (departmentId)
            where.departmentId = departmentId;
        if (designationId)
            where.designationId = designationId;
        if (status)
            where.status = status;
        const includeManagerInfo = {
            users: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                },
            },
            departments: true,
            designations: true,
            employees: {
                include: {
                    users: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            role: true,
                        },
                    },
                },
            },
        };
        const [data, total] = await Promise.all([
            this.prisma.employee.findMany({
                where,
                orderBy: { [(0, sort_by_1.safeSortBy)(sortBy, ALLOWED_SORT, 'createdAt')]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
                include: includeManagerInfo,
            }),
            this.prisma.employee.count({ where }),
        ]);
        const canViewSalary = [client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.ACCOUNTS].includes(role);
        const sanitizedData = canViewSalary
            ? data.map(normalizeEmployee)
            : data.map(({ salary, phone, address, ...rest }) => normalizeEmployee(rest));
        return {
            data: sanitizedData,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async findOne(id, companyId) {
        const employee = await this.prisma.employee.findFirst({
            where: { id, companyId },
            include: {
                users: true,
                departments: true,
                designations: true,
                employees: { include: { users: true } },
                otherEmployees: { include: { users: true } },
                attendanceDayAggregates: true,
                leaveRequestsLeaveRequestsEmployeeIdToemployees: true,
            },
        });
        if (!employee)
            throw new common_1.NotFoundException(`Employee with ID ${id} not found`);
        return normalizeEmployee(employee);
    }
    async update(id, dto, companyId) {
        const employee = await this.findOne(id, companyId);
        if (dto.status && dto.status !== employee.status) {
            this.transitionService.validate('Employee', employee.status, dto.status);
        }
        if (dto.userId !== undefined) {
            if (dto.userId) {
                const user = await this.prisma.user.findFirst({
                    where: { id: dto.userId, companyId },
                });
                if (!user)
                    throw new common_1.BadRequestException(`User with ID ${dto.userId} not found`);
                const existingUser = await this.prisma.employee.findFirst({
                    where: { userId: dto.userId, NOT: { id } },
                });
                if (existingUser)
                    throw new common_1.BadRequestException(`User ${dto.userId} already has an employee profile`);
            }
        }
        if (dto.departmentId) {
            const department = await this.prisma.department.findFirst({
                where: { id: dto.departmentId, companyId },
            });
            if (!department)
                throw new common_1.BadRequestException('Department not found');
        }
        if (dto.designationId) {
            const designation = await this.prisma.designation.findFirst({
                where: { id: dto.designationId, companyId },
            });
            if (!designation)
                throw new common_1.BadRequestException('Designation not found');
        }
        if (dto.managerId) {
            const manager = await this.prisma.employee.findFirst({
                where: { id: dto.managerId, companyId },
            });
            if (!manager)
                throw new common_1.BadRequestException('Manager not found');
        }
        if (dto.employeeCode) {
            const existingCode = await this.prisma.employee.findFirst({
                where: { companyId, employeeCode: dto.employeeCode, NOT: { id } },
            });
            if (existingCode)
                throw new common_1.BadRequestException(`Employee code ${dto.employeeCode} already exists`);
        }
        const data = { ...dto };
        if (dto.dateOfJoining !== undefined)
            data.dateOfJoining = dto.dateOfJoining
                ? new Date(dto.dateOfJoining)
                : null;
        if (dto.salary !== undefined)
            data.salary = dto.salary ? new client_1.Prisma.Decimal(dto.salary) : null;
        const updated = await this.prisma.employee.update({
            where: { id },
            data,
            include: {
                users: true,
                departments: true,
                designations: true,
                employees: { include: { users: true } },
            },
        });
        this.eventEmitter.emit('employee.updated', { companyId, entityId: id });
        return updated;
    }
    async invite(id, email, companyId) {
        const employee = await this.findOne(id, companyId);
        if (!employee.userId) {
            throw new common_1.BadRequestException('Employee has no linked user account');
        }
        const { randomBytes } = await Promise.resolve().then(() => __importStar(require('crypto')));
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await this.prisma.tempToken.create({
            data: {
                token,
                userId: employee.userId,
                companyId,
                purpose: 'EMPLOYEE_INVITE',
                expiresAt,
            },
        });
        this.eventEmitter.emit('employee.invited', {
            companyId,
            entityId: id,
            email: email || employee.users?.email,
            token,
        });
        return { success: true };
    }
    async remove(id, companyId) {
        await this.findOne(id, companyId);
        const result = await this.prisma.employee.update({ where: { id }, data: { deletedAt: new Date() } });
        this.eventEmitter.emit('employee.deleted', { companyId, entityId: id });
        return result;
    }
    async revokeAccess(id, companyId) {
        const employee = await this.findOne(id, companyId);
        if (employee.userId) {
            await this.prisma.user.update({
                where: { id: employee.userId },
                data: { isActive: false },
            });
        }
        return { success: true };
    }
    async findByIdWithCompanySettings(employeeId, companyId) {
        return this.prisma.employee.findFirst({
            where: { id: employeeId, companyId },
            include: { companies: { select: { settings: true } } },
        });
    }
    async findActiveForPayroll(companyId) {
        return this.prisma.employee.findMany({
            where: { companyId, status: 'ACTIVE' },
            select: { id: true, salary: true, dateOfJoining: true },
        });
    }
    async countActive(companyId) {
        return this.prisma.employee.count({
            where: { companyId, status: 'ACTIVE' },
        });
    }
    async findActiveBasic(companyId, limit = 50) {
        return this.prisma.employee.findMany({
            where: { companyId, status: 'ACTIVE' },
            select: {
                id: true,
                employeeCode: true,
                users: { select: { firstName: true, lastName: true } },
            },
            take: limit,
        });
    }
    async findByUserId(userId, companyId) {
        const where = { userId };
        if (companyId)
            where.companyId = companyId;
        return this.prisma.employee.findFirst({ where });
    }
    async findBasicById(employeeId) {
        return this.prisma.employee.findUnique({ where: { id: employeeId } });
    }
    async findBasicByIdAndCompany(employeeId, companyId) {
        return this.prisma.employee.findFirst({
            where: { id: employeeId, companyId },
            select: { id: true, userId: true },
        });
    }
};
exports.EmployeesService = EmployeesService;
exports.EmployeesService = EmployeesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2,
        transition_service_1.TransitionService])
], EmployeesService);
//# sourceMappingURL=employees.service.js.map