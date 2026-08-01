import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../config/prisma.service';
import { TransitionService } from '../../../common/services/transition.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';
import { Prisma, UserRole } from '@prisma/client';
import { safeSortBy } from '../../../common/utils/sort-by';

const ALLOWED_SORT = [
  'createdAt',
  'updatedAt',
  'employeeCode',
  'status',
  'dateOfJoining',
] as const;

function normalizeEmployee(emp: any): any {
  if (!emp) return emp;
  const result = { ...emp };
  if (result.users !== undefined) { result.user = result.users; delete result.users; }
  if (result.departments !== undefined) { result.department = result.departments; delete result.departments; }
  if (result.designations !== undefined) { result.designation = result.designations; delete result.designations; }
  return result;
}

@Injectable()
export class EmployeesService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private transitionService: TransitionService,
  ) {}

  async getMyProfile(userId: string, role?: UserRole) {
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
    if (!employee) throw new NotFoundException('Employee profile not found');

    // Strip sensitive fields for EMPLOYEE role
    if (role === UserRole.EMPLOYEE) {
      const { salary, phone, address, ...safeProfile } = employee;
      return safeProfile;
    }
    return employee;
  }

  private DESIGNATION_PREFIXES: Record<string, string> = {
    'Sales Manager': 'SM',
    'Sales Executive': 'SE',
    'HR Manager': 'HR',
    'Operations Manager': 'OM',
  };

  private async generateEmployeeCode(
    designationId: string,
    companyId: string,
  ): Promise<string> {
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
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }

    return `${prefix}-${String(nextNum).padStart(3, '0')}`;
  }

  async create(dto: CreateEmployeeDto, companyId: string) {
    const department = await this.prisma.department.findFirst({
      where: { id: dto.departmentId, companyId },
    });
    if (!department) throw new BadRequestException('Department not found');

    const designation = await this.prisma.designation.findFirst({
      where: { id: dto.designationId, companyId },
    });
    if (!designation) throw new BadRequestException('Designation not found');

    if (dto.managerId) {
      const manager = await this.prisma.employee.findFirst({
        where: { id: dto.managerId, companyId },
      });
      if (!manager) throw new BadRequestException('Manager not found');
    }

    const employeeCode =
      dto.employeeCode?.trim() ||
      (await this.generateEmployeeCode(dto.designationId, companyId));

    const existingCode = await this.prisma.employee.findUnique({
      where: {
        companyId_employeeCode: { companyId, employeeCode },
      },
    });
    if (existingCode)
      throw new BadRequestException(
        `Employee code ${employeeCode} already exists`,
      );

    if (dto.userId) {
      const user = await this.prisma.user.findFirst({
        where: { id: dto.userId, companyId },
      });
      if (!user)
        throw new BadRequestException(`User with ID ${dto.userId} not found`);

      const existingUser = await this.prisma.employee.findUnique({
        where: { userId: dto.userId },
      });
      if (existingUser)
        throw new BadRequestException(
          `User ${dto.userId} already has an employee profile`,
        );
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
        salary: dto.salary ? new Prisma.Decimal(dto.salary) : null,
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

  async findAll(query: QueryEmployeeDto, scopeFilter?: Record<string, any>, role?: string) {
    const {
      page = 1,
      limit = 10,
      search,
      departmentId,
      designationId,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.EmployeeWhereInput = {
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

    if (departmentId) where.departmentId = departmentId;
    if (designationId) where.designationId = designationId;
    if (status) where.status = status;

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
        orderBy: { [safeSortBy(sortBy, ALLOWED_SORT, 'createdAt')]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: includeManagerInfo,
      }),
      this.prisma.employee.count({ where }),
    ]);

    // Strip salary for non-privileged roles
    const canViewSalary = ([UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.ACCOUNTS] as string[]).includes(role as string);
    const sanitizedData = canViewSalary
      ? data.map(normalizeEmployee)
      : data.map(({ salary, phone, address, ...rest }: any) => normalizeEmployee(rest));

    return {
      data: sanitizedData,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, companyId: string) {
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
      throw new NotFoundException(`Employee with ID ${id} not found`);
    return normalizeEmployee(employee);
  }

  async update(id: string, dto: UpdateEmployeeDto, companyId: string) {
    const employee = await this.findOne(id, companyId);

    // Validate employee status transition if status is being changed
    if (dto.status && dto.status !== employee.status) {
      this.transitionService.validate(
        'Employee',
        employee.status,
        dto.status,
      );
    }

    if (dto.userId !== undefined) {
      if (dto.userId) {
        const user = await this.prisma.user.findFirst({
          where: { id: dto.userId, companyId },
        });
        if (!user)
          throw new BadRequestException(`User with ID ${dto.userId} not found`);
        const existingUser = await this.prisma.employee.findFirst({
          where: { userId: dto.userId, NOT: { id } },
        });
        if (existingUser)
          throw new BadRequestException(
            `User ${dto.userId} already has an employee profile`,
          );
      }
    }

    if (dto.departmentId) {
      const department = await this.prisma.department.findFirst({
        where: { id: dto.departmentId, companyId },
      });
      if (!department) throw new BadRequestException('Department not found');
    }

    if (dto.designationId) {
      const designation = await this.prisma.designation.findFirst({
        where: { id: dto.designationId, companyId },
      });
      if (!designation) throw new BadRequestException('Designation not found');
    }

    if (dto.managerId) {
      const manager = await this.prisma.employee.findFirst({
        where: { id: dto.managerId, companyId },
      });
      if (!manager) throw new BadRequestException('Manager not found');
    }

    if (dto.employeeCode) {
      const existingCode = await this.prisma.employee.findFirst({
        where: { companyId, employeeCode: dto.employeeCode, NOT: { id } },
      });
      if (existingCode)
        throw new BadRequestException(
          `Employee code ${dto.employeeCode} already exists`,
        );
    }

    const data: Prisma.EmployeeUpdateInput = { ...dto };
    if (dto.dateOfJoining !== undefined)
      data.dateOfJoining = dto.dateOfJoining
        ? new Date(dto.dateOfJoining)
        : null;
    if (dto.salary !== undefined)
      data.salary = dto.salary ? new Prisma.Decimal(dto.salary) : null;

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

  async invite(id: string, email: string, companyId: string) {
    const employee = await this.findOne(id, companyId);
    if (!employee.userId) {
      throw new BadRequestException('Employee has no linked user account');
    }
    const { randomBytes } = await import('crypto');
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

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    const result = await this.prisma.employee.update({ where: { id }, data: { deletedAt: new Date() } });
    this.eventEmitter.emit('employee.deleted', { companyId, entityId: id });
    return result;
  }

  async revokeAccess(id: string, companyId: string) {
    const employee = await this.findOne(id, companyId);

    if (employee.userId) {
      await this.prisma.user.update({
        where: { id: employee.userId },
        data: { isActive: false },
      });
    }

    return { success: true };
  }

  // ── Cross-module query methods ──────────────────────────────────
  // These methods provide a clean service-layer API for other modules
  // that need employee data, replacing direct Prisma.employee queries.

  /** Employee with company settings — used by AttendanceService for timezone. */
  async findByIdWithCompanySettings(employeeId: string, companyId: string) {
    return this.prisma.employee.findFirst({
      where: { id: employeeId, companyId },
      include: { companies: { select: { settings: true } } },
    });
  }

  /** Active employees with salary — used by PayrollService for payslip generation. */
  async findActiveForPayroll(companyId: string) {
    return this.prisma.employee.findMany({
      where: { companyId, status: 'ACTIVE' },
      select: { id: true, salary: true, dateOfJoining: true },
    });
  }

  /** Count of active employees — used by Attendance/Dashboard modules. */
  async countActive(companyId: string) {
    return this.prisma.employee.count({
      where: { companyId, status: 'ACTIVE' },
    });
  }

  /** Basic active employee list — used by AttendanceService for dashboard data. */
  async findActiveBasic(companyId: string, limit = 50) {
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

  /** Employee by userId — used by LeaveRequests/AttendanceCorrections for validation. */
  async findByUserId(userId: string, companyId?: string) {
    const where: { userId: string; companyId?: string } = { userId };
    if (companyId) where.companyId = companyId;
    return this.prisma.employee.findFirst({ where });
  }

  /** Employee by id (minimal fields) — used by LeaveRequests for validation. */
  async findBasicById(employeeId: string) {
    return this.prisma.employee.findUnique({ where: { id: employeeId } });
  }

  /** Employee by id scoped to company (minimal fields) — used by AttendanceCorrections. */
  async findBasicByIdAndCompany(employeeId: string, companyId: string) {
    return this.prisma.employee.findFirst({
      where: { id: employeeId, companyId },
      select: { id: true, userId: true },
    });
  }
}
