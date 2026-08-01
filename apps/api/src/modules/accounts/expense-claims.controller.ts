import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ExpenseClaimsService } from './expense-claims.service';
import {
  CreateExpenseClaimDto,
  UpdateExpenseClaimDto,
} from './dto/create-expense-claim.dto';
import { QueryExpenseClaimDto } from './dto/query-expense-claim.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permissions } from '../../common/auth/permissions';
import {
  CurrentCompany,
  CurrentEmployeeId,
} from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { UseIdempotency } from '../../common/decorators/idempotency.decorator';

@Controller('expense-claims')
export class ExpenseClaimsController {
  constructor(private readonly service: ExpenseClaimsService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTS, UserRole.MANAGER)
  @RequirePermissions(Permissions.EXPENSE_READ)
  async findAll(
    @Query() query: QueryExpenseClaimDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findAll(companyId, query.status);
  }

  @Get('my')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.HR_MANAGER, UserRole.ACCOUNTS, UserRole.MANAGER, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.EXPENSE_READ)
  async findMy(
    @CurrentEmployeeId() employeeId: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findByEmployee(employeeId, companyId);
  }

  @Post()
  @UseIdempotency()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.HR_MANAGER, UserRole.ACCOUNTS, UserRole.MANAGER, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.EXPENSE_CREATE)
  async create(
    @Body() dto: CreateExpenseClaimDto,
    @CurrentEmployeeId() employeeId: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.create(dto, employeeId, companyId);
  }

  @Patch(':id/approve')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.EXPENSE_APPROVE)
  async approve(
    @Param('id') id: string,
    @Body() dto: UpdateExpenseClaimDto,
    @CurrentEmployeeId() currentEmployeeId: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.approve(id, dto, currentEmployeeId, companyId);
  }
}
