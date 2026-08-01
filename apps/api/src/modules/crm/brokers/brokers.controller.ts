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
import { BrokersService } from './brokers.service';
import { CreateBrokerDto } from './dto/create-broker.dto';
import { UpdateBrokerDto } from './dto/update-broker.dto';
import { QueryBrokerDto } from './dto/query-broker.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { Permissions } from '../../../common/auth/permissions';
import { UserRole } from '@prisma/client';
import { CurrentUser, CurrentCompany } from '../../../common/decorators/current-user.decorator';
import { UseIdempotency } from '../../../common/decorators/idempotency.decorator';

@Controller('brokers')
export class BrokersController {
  constructor(private readonly brokersService: BrokersService) {}

  @Post()
  @UseIdempotency()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.BROKER_CREATE)
  async create(
    @Body() dto: CreateBrokerDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.brokersService.create(dto, companyId);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.BROKER_READ)
  async findAll(
    @Query() query: QueryBrokerDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.brokersService.findAll(query, companyId);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.BROKER_READ)
  async findOne(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.brokersService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.BROKER_UPDATE)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBrokerDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.brokersService.update(id, dto, companyId);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.BROKER_DELETE)
  async remove(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.brokersService.remove(id, companyId);
  }
}
