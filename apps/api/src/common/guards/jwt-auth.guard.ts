import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { PUBLIC_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    if (!process.env.AUTH_SECRET && process.env.NODE_ENV !== 'production') {
      return this.devFallback(context);
    }

    const result = (await super.canActivate(context)) as boolean;
    if (!result) return false;

    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
    const request = context.switchToHttp().getRequest();
    const { employee, company, ...user } = request.user;

    request.user = {
      id: user.id,
      clerkId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      companyId: user.companyId,
      employeeId: employee?.id ?? null,
    };
    request.company = company
      ? { id: company.id, name: company.name, slug: company.slug }
      : null;

    if (!request.company) {
      throw new UnauthorizedException('User not assigned to a company');
    }

    return true;
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  }

  private async devFallback(context: ExecutionContext): Promise<boolean> {
    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
    const request = context.switchToHttp().getRequest();
    const company = await this.prisma.company.findFirst({
      where: { slug: 'default-company' },
    });
    request.user = {
      id: 'dev-user',
      clerkId: 'dev-user',
      email: 'dev@example.com',
      firstName: 'Dev',
      lastName: 'User',
      role: 'ADMIN',
      companyId: company?.id ?? 'dev-company',
      employeeId: null,
    };
    request.company = company
      ? { id: company.id, name: company.name, slug: company.slug }
      : { id: 'dev-company', name: 'Dev Company', slug: 'dev-company' };
    return true;
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  }
}
