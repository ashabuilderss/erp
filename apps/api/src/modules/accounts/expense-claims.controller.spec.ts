import 'reflect-metadata';
import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { ExpenseClaimsController } from './expense-claims.controller';

interface RouteArgumentMetadata {
  index: number;
  data?: unknown;
  factory: (data: unknown, context: ExecutionContext) => unknown;
}

describe('ExpenseClaimsController', () => {
  it('injects the current employee ID when approving an expense claim', () => {
    const userId = 'user-123';
    const employeeId = 'employee-456';
    const routeArguments = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      ExpenseClaimsController,
      'approve',
    ) as Record<string, RouteArgumentMetadata>;
    const approverArgument = Object.values(routeArguments).find(
      ({ index }) => index === 2,
    );
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { id: userId, employeeId } }),
      }),
    } as ExecutionContext;

    expect(approverArgument).toBeDefined();
    expect(approverArgument?.factory(approverArgument.data, context)).toBe(
      employeeId,
    );
  });
});
