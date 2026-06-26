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
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentCompany,
  CurrentEmployeeId,
} from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('expense-claims')
export class ExpenseClaimsController {
  constructor(private readonly service: ExpenseClaimsService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async findAll(
    @Query('status') status: string | undefined,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findAll(companyId, status);
  }

  @Get('my')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.HR_MANAGER)
  async findMy(
    @CurrentEmployeeId() employeeId: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findByEmployee(employeeId, companyId);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.HR_MANAGER)
  async create(
    @Body() dto: CreateExpenseClaimDto,
    @CurrentEmployeeId() employeeId: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.create(dto, employeeId, companyId);
  }

  @Patch(':id/approve')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async approve(
    @Param('id') id: string,
    @Body() dto: UpdateExpenseClaimDto,
    @CurrentEmployeeId() currentEmployeeId: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.approve(id, dto, currentEmployeeId, companyId);
  }
}
