import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Require2FA } from '../../common/decorators/require-2fa.decorator';
import { Permissions } from '../../common/auth/permissions';
import {
  CurrentCompany,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.OWNER)
  @RequirePermissions(Permissions.USER_READ)
  async findAll(
    @Query() query: QueryUserDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.usersService.findAll(query, companyId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.USER_READ)
  async findOne(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.usersService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.USER_UPDATE)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentCompany('id') companyId: string,
    @CurrentUser('id') currentUserId: string,
    @CurrentUser('role') currentUserRole: UserRole,
  ) {
    // Non-OWNER cannot assign or modify OWNER/ADMIN roles
    if (currentUserRole !== UserRole.OWNER && dto.role) {
      if (dto.role === UserRole.OWNER || dto.role === UserRole.ADMIN) {
        throw new ForbiddenException('Only OWNER can assign OWNER or ADMIN roles');
      }
    }
    // Non-OWNER cannot change their own role
    if (currentUserRole !== UserRole.OWNER && id === currentUserId && dto.role) {
      throw new ForbiddenException('Cannot change your own role');
    }
    // Non-OWNER cannot modify other ADMIN users (prevents admin-demotion attacks)
    if (currentUserRole !== UserRole.OWNER) {
      const target = await this.usersService.findOne(id, companyId);
      if (target.role === UserRole.OWNER || target.role === UserRole.ADMIN) {
        throw new ForbiddenException('Only OWNER can modify ADMIN or OWNER users');
      }
    }
    // OWNER cannot self-demote (prevents lockout)
    if (currentUserRole === UserRole.OWNER && id === currentUserId && dto.role) {
      throw new ForbiddenException('Cannot change your own role');
    }
    return this.usersService.update(id, dto, companyId);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.USER_DELETE)
  @Require2FA()
  async remove(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
    @CurrentUser('id') currentUserId: string,
    @CurrentUser('role') currentUserRole: UserRole,
  ) {
    if (id === currentUserId) {
      throw new ForbiddenException('Cannot deactivate your own account');
    }
    // Only OWNER can deactivate another OWNER
    if (currentUserRole !== UserRole.OWNER) {
      const target = await this.usersService.findOne(id, companyId);
      if (target.role === UserRole.OWNER) {
        throw new ForbiddenException('Cannot deactivate an OWNER account');
      }
    }
    return this.usersService.remove(id, companyId);
  }

  @Patch('me/preferences')
  async updatePreferences(
    @Body() dto: UpdatePreferencesDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.usersService.updatePreferences(userId, dto);
  }
}
