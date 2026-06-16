import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../config/prisma.service';
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

@Injectable()
export class EmployeesService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async getMyProfile(userId: string, role?: UserRole) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
      include: {
        user: true,
        department: true,
        designation: true,
        manager: { include: { user: true } },
      },
    });
    if (!employee) throw new NotFoundException('Employee profile not found');
    if (role === UserRole.EMPLOYEE) {
      const { ...rest } = employee;
      return rest;
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
      dto.employeeCode ??
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
      },
      include: {
        user: true,
        department: true,
        designation: true,
        manager: true,
      },
    });

    this.eventEmitter.emit('employee.created', {
      companyId,
      entityId: employee.id,
    });
    return employee;
  }

  async findAll(query: QueryEmployeeDto, companyId: string) {
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

    const where: Prisma.EmployeeWhereInput = { companyId };

    if (search) {
      where.OR = [
        { employeeCode: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (departmentId) where.departmentId = departmentId;
    if (designationId) where.designationId = designationId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        orderBy: { [safeSortBy(sortBy, ALLOWED_SORT, 'createdAt')]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: true,
          department: true,
          designation: true,
          manager: { include: { user: true } },
        },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, companyId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, companyId },
      include: {
        user: true,
        department: true,
        designation: true,
        manager: { include: { user: true } },
        subordinates: { include: { user: true } },
        attendance: true,
        leaveRequests: true,
      },
    });
    if (!employee)
      throw new NotFoundException(`Employee with ID ${id} not found`);
    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto, companyId: string) {
    await this.findOne(id, companyId);

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
        user: true,
        department: true,
        designation: true,
        manager: { include: { user: true } },
      },
    });
    this.eventEmitter.emit('employee.updated', { companyId, entityId: id });
    return updated;
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    const result = await this.prisma.employee.delete({ where: { id } });
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
}
