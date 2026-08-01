import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { UpdateBookingPaymentStatusDto } from './dto/update-booking-payment-status.dto';
import { QueryBookingDto } from './dto/query-booking.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  CurrentCompany,
  CurrentEmployeeId,
  CurrentUser,
} from '../../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { CacheInvalidateExtra } from '../../../common/decorators/cache.decorators';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { Permissions } from '../../../common/auth/permissions';
import { UseIdempotency } from '../../../common/decorators/idempotency.decorator';
import { getEffectiveScopeFilter } from '../../../common/utils/scope-helper.util';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @UseIdempotency()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.ACCOUNTS, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.BOOKING_CREATE)
  @CacheInvalidateExtra(['bookings', 'properties', 'commissions'])
  async create(
    @Body() dto: CreateBookingDto,
    @CurrentCompany('id') companyId: string,
    @CurrentUser('role') role: string,
    @CurrentEmployeeId() employeeId: string | null,
  ) {
    return this.bookingsService.create(
      dto,
      companyId,
      role,
      employeeId ?? undefined,
    );
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.ACCOUNTS, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.BOOKING_READ)
  async findAll(
    @Query() query: QueryBookingDto,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentUser('scopes') scopes: Record<string, string>,
    @CurrentUser('teamId') teamId: string | null,
    @CurrentUser('departmentId') departmentId: string | null,
  ) {
    const scopeFilter = getEffectiveScopeFilter(scopes, Permissions.BOOKING_READ, {
      companyId,
      employeeId,
      teamId,
      departmentId,
    });
    return this.bookingsService.findAll(query, scopeFilter);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.ACCOUNTS, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.BOOKING_READ)
  async findOne(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentUser('scopes') scopes: Record<string, string>,
    @CurrentUser('teamId') teamId: string | null,
    @CurrentUser('departmentId') departmentId: string | null,
  ) {
    const scopeFilter = getEffectiveScopeFilter(scopes, Permissions.BOOKING_READ, {
      companyId,
      employeeId,
      teamId,
      departmentId,
    });
    return this.bookingsService.findOne(id, scopeFilter);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.ACCOUNTS, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.BOOKING_UPDATE)
  @CacheInvalidateExtra(['bookings', 'properties', 'commissions'])
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBookingDto,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentUser('scopes') scopes: Record<string, string>,
    @CurrentUser('role') role: string,
    @CurrentUser('teamId') teamId: string | null,
    @CurrentUser('departmentId') departmentId: string | null,
  ) {
    const scopeFilter = getEffectiveScopeFilter(scopes, Permissions.BOOKING_UPDATE, {
      companyId,
      employeeId,
      teamId,
      departmentId,
    });
    return this.bookingsService.update(
      id,
      dto,
      companyId,
      scopeFilter,
      role,
      employeeId ?? undefined,
    );
  }

  @Patch(':id/status')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.ACCOUNTS, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.BOOKING_UPDATE)
  @CacheInvalidateExtra(['bookings', 'properties', 'commissions'])
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentUser('scopes') scopes: Record<string, string>,
    @CurrentUser('role') role: string,
    @CurrentUser('teamId') teamId: string | null,
    @CurrentUser('departmentId') departmentId: string | null,
  ) {
    const scopeFilter = getEffectiveScopeFilter(scopes, Permissions.BOOKING_UPDATE, {
      companyId,
      employeeId,
      teamId,
      departmentId,
    });
    return this.bookingsService.updateStatus(
      id,
      dto.status,
      companyId,
      scopeFilter,
      role,
      employeeId ?? undefined,
    );
  }

  @Patch(':id/payment-status')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.ACCOUNTS, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.BOOKING_UPDATE)
  @CacheInvalidateExtra(['bookings', 'properties', 'commissions'])
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingPaymentStatusDto,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentUser('scopes') scopes: Record<string, string>,
    @CurrentUser('role') role: string,
    @CurrentUser('teamId') teamId: string | null,
    @CurrentUser('departmentId') departmentId: string | null,
  ) {
    const scopeFilter = getEffectiveScopeFilter(scopes, Permissions.BOOKING_UPDATE, {
      companyId,
      employeeId,
      teamId,
      departmentId,
    });
    return this.bookingsService.updatePaymentStatus(
      id,
      dto.paymentStatus,
      companyId,
      scopeFilter,
      role,
      employeeId ?? undefined,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @RequirePermissions(Permissions.BOOKING_DELETE)
  async remove(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.bookingsService.remove(id, companyId);
  }
}
