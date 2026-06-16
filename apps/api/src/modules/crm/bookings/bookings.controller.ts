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
import { CurrentCompany } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async create(
    @Body() dto: CreateBookingDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.bookingsService.create(dto, companyId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async findAll(
    @Query() query: QueryBookingDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.bookingsService.findAll(query, companyId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async findOne(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.bookingsService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBookingDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.bookingsService.update(id, dto, companyId);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.bookingsService.updateStatus(id, dto.status, companyId);
  }

  @Patch(':id/payment-status')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingPaymentStatusDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.bookingsService.updatePaymentStatus(
      id,
      dto.paymentStatus,
      companyId,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.bookingsService.remove(id, companyId);
  }
}
