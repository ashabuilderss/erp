import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../../config/prisma.service';
import { LoggerService } from '../../common/logger/logger.service';
import { Prisma, UserRole } from '@prisma/client';
import { TwoFactorService } from './two-factor.service';
import {
  getPermissionsForRole,
  mergePermissionsWithGrants,
} from '../../common/auth/permissions';

const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

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
    private eventEmitter: EventEmitter2,
    private logger: LoggerService,
    private twoFactorService: TwoFactorService,
  ) {}

  async getEffectivePermissions(userId: string, role: UserRole) {
    const grants = await this.prisma.permissionGrant.findMany({
      where: { userId },
      select: { permission: true, granted: true },
    });
    return mergePermissionsWithGrants(getPermissionsForRole(role), grants);
  }

  async precheck(email: string, password: string) {
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

    if (user.totpEnabled) {
      return this.twoFactorService.generateChallenge(user.id, user.companyId);
    }

    return { requiresTwoFactor: false };
  }

  async login(email: string, password: string, ipAddress?: string) {
    const user = await this.prisma.user.findFirst({
      where: { email, isActive: true },
    });
    if (!user || !user.hashedPassword) {
      this.eventEmitter.emit('security.login.failure', {
        email,
        reason: 'User not found or no password',
        ipAddress,
      });
      throw new UnauthorizedException('Invalid email or password');
    }
    const valid = await bcrypt.compare(password, user.hashedPassword);
    if (!valid) {
      this.eventEmitter.emit('security.login.failure', {
        email,
        reason: 'Invalid password',
        ipAddress,
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.totpEnabled) {
      return this.twoFactorService.generateChallenge(user.id, user.companyId);
    }

    // Revoke old tokens on login (prevents session fixation)
    await this.revokeAllUserTokens(user.id);

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

    this.eventEmitter.emit('security.login.success', {
      userId: user.id,
      companyId: user.companyId,
      email: user.email,
      ipAddress,
    });

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
    const tokenHash = hashToken(refreshTokenStr);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: tokenHash },
      include: { users: { include: { employees: true } } },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Block refresh for deactivated users
    if (!stored.users.isActive) {
      throw new UnauthorizedException('Account has been deactivated');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const employee = stored.users.employees;
    const payload = {
      sub: stored.users.id,
      email: stored.users.email,
      role: stored.users.role,
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
    const tokenHash = hashToken(token);
    await this.prisma.refreshToken.updateMany({
      where: { token: tokenHash, revokedAt: null },
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
    const rawToken = randomBytes(48).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await this.prisma.refreshToken.create({
      data: { token: tokenHash, userId, companyId, expiresAt },
    });

    return { token: rawToken };
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
      dto.employeeCode?.trim() ||
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

    // Only OWNER can create OWNER or ADMIN accounts
    if (
      (targetRole === UserRole.OWNER || targetRole === UserRole.ADMIN) &&
      requesterRole !== UserRole.OWNER
    ) {
      throw new BadRequestException('Only OWNER can create OWNER or ADMIN accounts');
    }

    // HR_MANAGER can only create EMPLOYEE accounts
    if (requesterRole !== UserRole.ADMIN && requesterRole !== UserRole.OWNER && targetRole !== UserRole.EMPLOYEE) {
      throw new BadRequestException('Only ADMIN and OWNER can create non-employee accounts');
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
          include: { users: true, departments: true, designations: true },
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

  async getFullUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { totpEnabled: true },
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    opts?: { totpToken?: string; ipAddress?: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        companyId: true,
        hashedPassword: true,
        totpEnabled: true,
      },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (!user.hashedPassword) {
      throw new BadRequestException('No password set for this account');
    }

    const valid = await bcrypt.compare(currentPassword, user.hashedPassword);
    if (!valid) {
      this.eventEmitter.emit('security.password.change.failure', {
        userId,
        companyId: user.companyId,
        ipAddress: opts?.ipAddress,
        reason: 'Invalid current password',
      });
      throw new UnauthorizedException('Current password is incorrect');
    }

    // §3.1: cannot reuse the last 5 passwords
    const recent = await this.prisma.passwordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    for (const entry of recent) {
      if (await bcrypt.compare(newPassword, entry.hashedPassword)) {
        throw new BadRequestException(
          'New password must differ from the last 5 passwords',
        );
      }
    }

    // §3.1: TOTP re-challenge for 2FA-enabled accounts (Owner / Admin are
    // required to have 2FA enrolled).
    if (user.totpEnabled) {
      if (!opts?.totpToken) {
        throw new UnauthorizedException(
          'A TOTP verification code is required for this account',
        );
      }
      await this.twoFactorService.verifyTotp(userId, opts.totpToken);
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { hashedPassword },
      });
      await tx.passwordHistory.create({
        data: {
          userId,
          companyId: user.companyId,
          hashedPassword,
        },
      });
    });

    // §3.1: security audit log entry
    this.eventEmitter.emit('security.password.change', {
      userId,
      companyId: user.companyId,
    });

    // Revoke all existing refresh tokens to force re-login
    await this.revokeAllUserTokens(userId);

    return { success: true, message: 'Password changed successfully. Please log in again.' };
  }
}
