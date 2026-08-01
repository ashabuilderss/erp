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
import { PortalsService } from './portals.service';
import {
  CreateComplaintDto,
  UpdateComplaintDto,
  QueryComplaintDto,
  ResolveComplaintDto,
} from './dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permissions } from '../../common/auth/permissions';
import { CurrentCompany } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { UseIdempotency } from '../../common/decorators/idempotency.decorator';

@Controller()
export class PortalsController {
  constructor(private readonly portalsService: PortalsService) {}

  @Post('complaints')
  @UseIdempotency()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  @RequirePermissions(Permissions.COMPLAINT_CREATE)
  async createComplaint(
    @Body() dto: CreateComplaintDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.portalsService.createComplaint(dto, companyId);
  }

  @Get('complaints')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  @RequirePermissions(Permissions.COMPLAINT_READ)
  async findAllComplaints(
    @Query() query: QueryComplaintDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.portalsService.findAllComplaints(query, companyId);
  }

  @Get('complaints/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  @RequirePermissions(Permissions.COMPLAINT_READ)
  async findOneComplaint(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.portalsService.findOneComplaint(id, companyId);
  }

  @Patch('complaints/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  @RequirePermissions(Permissions.COMPLAINT_CREATE)
  async updateComplaint(
    @Param('id') id: string,
    @Body() dto: UpdateComplaintDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.portalsService.updateComplaint(id, dto, companyId);
  }

  @Delete('complaints/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  @RequirePermissions(Permissions.COMPLAINT_CREATE)
  async deleteComplaint(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.portalsService.deleteComplaint(id, companyId);
  }

  @Post('complaints/:id/resolve')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  @RequirePermissions(Permissions.COMPLAINT_CREATE)
  async resolveComplaint(
    @Param('id') id: string,
    @Body() dto: ResolveComplaintDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.portalsService.resolveComplaint(id, dto.resolution, companyId);
  }
}
