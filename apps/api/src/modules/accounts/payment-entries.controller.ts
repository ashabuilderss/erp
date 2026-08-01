import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { PaymentEntriesService } from './payment-entries.service';
import {
  CreatePaymentEntryDto,
  UpdatePaymentEntryDto,
} from './dto/create-payment-entry.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permissions } from '../../common/auth/permissions';
import {
  CurrentCompany,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { UseIdempotency } from '../../common/decorators/idempotency.decorator';

@Controller('payment-entries')
export class PaymentEntriesController {
  constructor(private readonly service: PaymentEntriesService) {}

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
  @UseIdempotency()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTS)
  @RequirePermissions(Permissions.PAYMENT_CREATE)
  async create(
    @Param('bookingId') bookingId: string,
    @Body() dto: CreatePaymentEntryDto,
    @CurrentUser('id') currentUserId: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.create(bookingId, dto, currentUserId, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTS)
  @RequirePermissions(Permissions.PAYMENT_CREATE)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentEntryDto,
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
