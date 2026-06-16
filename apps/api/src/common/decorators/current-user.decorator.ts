import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
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

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    return data ? user?.[data as keyof typeof user] : user;
  },
);

export const CurrentCompany = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const company = request.company;
    return data ? company?.[data as keyof typeof company] : company;
  },
);

export const CurrentEmployeeId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user.employeeId;
  },
);
