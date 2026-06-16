import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Roles, Public } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateEmployeeWithUserDto } from './dto/create-employee-with-user.dto';
import { LoginDto } from './dto/login.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    clerkId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    companyId: string;
    employeeId: string | null;
  };
  company: {
    id: string;
    name: string;
    slug: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @Public()
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('refresh')
  @Public()
  async refresh(@Body() dto: { refreshToken: string }) {
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
    return {
      user: {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role,
        isActive: true,
      },
      company: {
        id: req.company.id,
        name: req.company.name,
        slug: req.company.slug,
      },
      employee: employee
        ? { id: employee.id, employeeCode: employee.employeeCode }
        : null,
      permissions: [],
    };
  }
}
