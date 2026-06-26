import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { PermissionGrantsService } from './permission-grants.service';
import { UpdatePermissionGrantsDto } from './dto/update-permission-grants.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentCompany,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('permission-grants')
export class PermissionGrantsController {
  constructor(private readonly service: PermissionGrantsService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async findAll(@CurrentCompany('id') companyId: string) {
    return this.service.findAll(companyId);
  }

  @Get('user/:userId')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async findByUser(
    @Param('userId') userId: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findByUser(userId, companyId);
  }

  @Patch('user/:userId')
  @Roles(UserRole.OWNER)
  async updateUserGrants(
    @Param('userId') userId: string,
    @Body() dto: UpdatePermissionGrantsDto,
    @CurrentUser('id') currentUserId: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.updateUserGrants(userId, dto, currentUserId, companyId);
  }
}
