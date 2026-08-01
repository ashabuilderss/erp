import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { CreatePayrollRunDto } from './dto/create-payroll-run.dto';
import { QueryPayrollRunDto } from './dto/query-payroll-run.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { Permissions } from '../../../common/auth/permissions';
import {
  CurrentCompany,
  CurrentEmployeeId,
} from '../../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { UseIdempotency } from '../../../common/decorators/idempotency.decorator';

@Controller()
export class PayrollController {
  constructor(private readonly service: PayrollService) {}

  @Post('payroll-runs')
  @UseIdempotency()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.ACCOUNTS)
  @RequirePermissions(Permissions.PAYROLL_PROCESS)
  async createRun(
    @Body() dto: CreatePayrollRunDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.createRun(dto, companyId);
  }

  @Get('payroll-runs')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.ACCOUNTS)
  @RequirePermissions(Permissions.PAYROLL_READ)
  async findAllRuns(
    @Query() query: QueryPayrollRunDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findAllRuns(query, companyId);
  }

  @Get('payroll-runs/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.ACCOUNTS)
  @RequirePermissions(Permissions.PAYROLL_READ)
  async findOneRun(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findOneRun(id, companyId);
  }

  @Post('payroll-runs/:id/process')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.ACCOUNTS)
  @RequirePermissions(Permissions.PAYROLL_PROCESS)
  async processRun(
    @Param('id') id: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.processRun(id, employeeId!, companyId);
  }

  @Post('payroll-runs/:id/pay')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.ACCOUNTS)
  @RequirePermissions(Permissions.PAYROLL_PROCESS)
  async markPaid(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.markPaid(id, companyId);
  }

  @Post('payroll-runs/:id/cancel')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.ACCOUNTS)
  @RequirePermissions(Permissions.PAYROLL_PROCESS)
  async cancelRun(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.cancelRun(id, companyId);
  }

  @Get('payslips/me')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.PAYROLL_READ)
  async findMyPayslips(
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findMyPayslips(employeeId!, companyId);
  }

  @Get('payslips/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.ACCOUNTS)
  @RequirePermissions(Permissions.PAYROLL_READ)
  async findOnePayslip(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findOnePayslip(id, companyId);
  }
}
