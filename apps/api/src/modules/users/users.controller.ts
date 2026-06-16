import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentCompany,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async findAll(
    @Query() query: QueryUserDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.usersService.findAll(query, companyId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async findOne(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.usersService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.usersService.update(id, dto, companyId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
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
