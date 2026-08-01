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
import { DeviceRegistrationsService } from './device-registrations.service';
import { CreateDeviceRegistrationDto } from './dto/create-device-registration.dto';
import { QueryDeviceRegistrationDto } from './dto/query-device-registration.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { Permissions } from '../../../common/auth/permissions';
import {
  CurrentCompany,
  CurrentEmployeeId,
} from '../../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { UseIdempotency } from '../../../common/decorators/idempotency.decorator';

@Controller('device-registrations')
export class DeviceRegistrationsController {
  constructor(private readonly service: DeviceRegistrationsService) {}

  @Post()
  @UseIdempotency()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.DEVICE_CREATE)
  async create(
    @Body() dto: CreateDeviceRegistrationDto,
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.create(dto, employeeId!, companyId);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  @RequirePermissions(Permissions.DEVICE_READ)
  async findAll(
    @Query() query: QueryDeviceRegistrationDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findAll(query, companyId);
  }

  @Get('me')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.DEVICE_READ)
  async findMyDevices(@CurrentEmployeeId() employeeId: string | null) {
    return this.service.findMyDevices(employeeId!);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  @RequirePermissions(Permissions.DEVICE_READ)
  async findOne(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  @RequirePermissions(Permissions.DEVICE_UPDATE)
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateDeviceRegistrationDto>,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.update(id, dto, companyId);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  @RequirePermissions(Permissions.DEVICE_UPDATE)
  async remove(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.remove(id, companyId);
  }
}
