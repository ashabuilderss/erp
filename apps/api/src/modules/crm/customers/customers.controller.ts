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
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import {
  CurrentUser,
  CurrentCompany,
} from '../../../common/decorators/current-user.decorator';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async create(
    @Body() dto: CreateCustomerDto,
    @CurrentUser('id') userId: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.customersService.create(dto, userId, companyId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async findAll(
    @Query() query: QueryCustomerDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.customersService.findAll(query, companyId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async findOne(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.customersService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.customersService.update(id, dto, companyId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.customersService.remove(id, companyId);
  }
}
