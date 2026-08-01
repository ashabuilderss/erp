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
import { PaymentSchedulesService } from './payment-schedules.service';
import {
  CreatePaymentScheduleDto,
  UpdatePaymentScheduleDto,
} from './dto/create-payment-schedule.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permissions } from '../../common/auth/permissions';
import {
  CurrentCompany,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('payment-schedules')
export class PaymentSchedulesController {
  constructor(private readonly service: PaymentSchedulesService) {}

  @Get('booking/:bookingId')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTS)
  @RequirePermissions(Permissions.PAYMENT_READ)
  async findByBooking(
    @Param('bookingId') bookingId: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findByBooking(bookingId, companyId);
  }

  @Post('booking/:bookingId')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTS)
  @RequirePermissions(Permissions.PAYMENT_CREATE)
  async create(
    @Param('bookingId') bookingId: string,
    @Body() dto: CreatePaymentScheduleDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.create(bookingId, dto, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTS)
  @RequirePermissions(Permissions.PAYMENT_CREATE)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentScheduleDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.update(id, dto, companyId);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTS)
  @RequirePermissions(Permissions.PAYMENT_CREATE)
  async remove(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.remove(id, companyId);
  }
}
