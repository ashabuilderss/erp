import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { DealersService } from './dealers.service';
import { CreateDealerDto, UpdateDealerDto, QueryDealerDto } from './dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentCompany } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller()
export class DealersController {
  constructor(private readonly service: DealersService) {}

  @Post('dealers')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async create(@Body() dto: CreateDealerDto, @CurrentCompany('id') companyId: string) {
    return this.service.create(dto, companyId);
  }

  @Get('dealers')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async findAll(@Query() query: QueryDealerDto, @CurrentCompany('id') companyId: string) {
    return this.service.findAll(query, companyId);
  }

  @Get('dealers/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async findOne(@Param('id') id: string, @CurrentCompany('id') companyId: string) {
    return this.service.findOne(id, companyId);
  }

  @Patch('dealers/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateDealerDto, @CurrentCompany('id') companyId: string) {
    return this.service.update(id, dto, companyId);
  }

  @Delete('dealers/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async delete(@Param('id') id: string, @CurrentCompany('id') companyId: string) {
    return this.service.delete(id, companyId);
  }
}
