import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { Roles, Public } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateEmployeeWithUserDto } from './dto/create-employee-with-user.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';

const LOGIN_THROTTLE_LIMIT = Number(
  process.env.AUTH_LOGIN_THROTTLE_LIMIT ?? 30,
);

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('precheck')
  @Public()
  @Throttle({ default: { limit: LOGIN_THROTTLE_LIMIT, ttl: 60000 } })
  async precheck(@Body() dto: LoginDto) {
    return this.authService.precheck(dto.email, dto.password);
  }

  @Post('login')
  @Public()
  @Throttle({ default: { limit: LOGIN_THROTTLE_LIMIT, ttl: 60000 } })
  async login(@Body() dto: LoginDto, @Req() req: AuthenticatedRequest) {
    const headers = req.headers as unknown as Record<
      string,
      string | string[] | undefined
    >;
    const forwarded = headers['x-forwarded-for'];
    const realIp = headers['x-real-ip'];
       return this.authService.login(
          dto.email,
          dto.password,
          this.getIpAddress(req),
        );
      }

      private getIpAddress(req: AuthenticatedRequest): string {
        const headers = req.headers as unknown as Record<
          string,
          string | string[] | undefined
        >;
        const forwarded = headers['x-forwarded-for'];
        const realIp = headers['x-real-ip'];
        return (
          (Array.isArray(forwarded) ? forwarded[0] : forwarded)
            ?.split(',')[0]
            ?.trim() ||
          (Array.isArray(realIp) ? realIp[0] : realIp) ||
          'unknown'
        );
      }

  @Post('refresh')
  @Public()
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  async logout(@Req() req: AuthenticatedRequest) {
    await this.authService.revokeAllUserTokens(req.user.id);
    return { success: true };
  }

  @Post('employees/with-user')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async createEmployeeWithUser(
    @Body() dto: CreateEmployeeWithUserDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.authService.createEmployeeWithUser(
      dto,
      req.user.companyId,
      req.user.role as UserRole,
    );
  }

  @Get('me')
  async getMe(@Req() req: AuthenticatedRequest) {
    const employee = await this.authService.getEmployeeByUserId(req.user.id);
    const user = await this.authService.getFullUser(req.user.id);
    const permissions = await this.authService.getEffectivePermissions(
      req.user.id,
      req.user.role as UserRole,
    );
    return {
      user: {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role,
        isActive: true,
        totpEnabled: user?.totpEnabled ?? false,
      },
      company: req.company ? {
        id: req.company.id,
        name: req.company.name,
        slug: req.company.slug,
      } : null,
      employee: employee
        ? { id: employee.id, employeeCode: employee.employeeCode }
        : null,
      permissions,
    };
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('change-password')
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() req: AuthenticatedRequest,
  ) {
       return this.authService.changePassword(
      req.user.id,
      dto.currentPassword,
      dto.newPassword,
      { totpToken: dto.totpToken, ipAddress: this.getIpAddress(req) },
    );
  }
}
