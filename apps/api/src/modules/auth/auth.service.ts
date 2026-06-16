import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../config/prisma.service';
import { LoggerService } from '../../common/logger/logger.service';
import { Prisma, UserRole } from '@prisma/client';

const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

interface CreateEmployeeWithUserDto {
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  employeeCode?: string;
  departmentId: string;
  designationId: string;
  phone?: string;
  dateOfJoining?: string;
  salary?: number;
  address?: string;
  role?: UserRole;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private logger: LoggerService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { email, isActive: true },
    });
    if (!user || !user.hashedPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const valid = await bcrypt.compare(password, user.hashedPassword);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const employee = await this.prisma.employee.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      employeeId: employee?.id ?? null,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });
    const refreshToken = await this.createRefreshToken(user.id, user.companyId);

    return {
      accessToken,
      refreshToken: refreshToken.token,
      expiresIn: 900,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId,
        employeeId: employee?.id ?? null,
      },
    };
  }

  async refresh(refreshTokenStr: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenStr },
      include: { user: { include: { employee: true } } },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const employee = stored.user.employee;
    const payload = {
      sub: stored.user.id,
      email: stored.user.email,
      role: stored.user.role,
      companyId: stored.companyId,
      employeeId: employee?.id ?? null,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });
    const newRefreshToken = await this.createRefreshToken(
      stored.userId,
      stored.companyId,
    );

    return {
      accessToken,
      refreshToken: newRefreshToken.token,
      expiresIn: 900,
    };
  }

  async revokeRefreshToken(token: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllUserTokens(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async createRefreshToken(userId: string, companyId: string) {
    const token = randomBytes(48).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    const created = await this.prisma.refreshToken.create({
      data: { token, userId, companyId, expiresAt },
    });

    return created;
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

  async createEmployeeWithUser(
    dto: CreateEmployeeWithUserDto,
    companyId: string,
    requesterRole: UserRole,
  ) {
    const department = await this.prisma.department.findFirst({
      where: { id: dto.departmentId, companyId },
    });
    if (!department) {
      throw new BadRequestException('Department not found in your company');
    }

    const designation = await this.prisma.designation.findFirst({
      where: { id: dto.designationId, companyId },
    });
    if (!designation) {
      throw new BadRequestException('Designation not found in your company');
    }

    const employeeCode =
      dto.employeeCode ??
      (await this.generateEmployeeCode(dto.designationId, companyId));

    const existingEmployee = await this.prisma.employee.findFirst({
      where: { employeeCode, companyId },
    });
    if (existingEmployee) {
      throw new ConflictException(
        `Employee code "${employeeCode}" already exists`,
      );
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email, companyId },
    });
    if (existingUser) {
      throw new ConflictException(
        `User with email "${dto.email}" already exists`,
      );
    }

    const targetRole = dto.role || UserRole.EMPLOYEE;

    if (requesterRole !== UserRole.ADMIN && targetRole !== UserRole.EMPLOYEE) {
      throw new BadRequestException('HR can only create employee accounts');
    }

    const hashedPassword = dto.password
      ? await bcrypt.hash(dto.password, BCRYPT_ROUNDS)
      : null;

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          companyId,
          firstName: dto.firstName,
          lastName: dto.lastName,
          hashedPassword,
          role: targetRole,
        },
      });

      if (targetRole === UserRole.EMPLOYEE) {
        const employee = await tx.employee.create({
          data: {
            userId: user.id,
            employeeCode,
            companyId,
            departmentId: dto.departmentId,
            designationId: dto.designationId,
            phone: dto.phone,
            dateOfJoining: dto.dateOfJoining
              ? new Date(dto.dateOfJoining)
              : null,
            salary: dto.salary ? new Prisma.Decimal(dto.salary) : null,
            address: dto.address,
            status: 'ACTIVE',
          },
          include: { user: true, department: true, designation: true },
        });
        return { user, employee };
      }

      return { user, employee: null };
    });
  }

  async getEmployeeByUserId(userId: string) {
    return this.prisma.employee.findUnique({
      where: { userId },
      select: { id: true, employeeCode: true },
    });
  }
}
