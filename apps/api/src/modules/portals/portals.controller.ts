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
  CreateBrokerDto,
  QueryBrokerDto,
  CreateComplaintDto,
  UpdateComplaintDto,
  QueryComplaintDto,
  ResolveComplaintDto,
} from './dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentCompany } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller()
export class PortalsController {
  constructor(private readonly portalsService: PortalsService) {}

  @Post('brokers')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async createBroker(
    @Body() dto: CreateBrokerDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.portalsService.createBroker(dto, companyId);
  }

  @Get('brokers')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async findAllBrokers(
    @Query() query: QueryBrokerDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.portalsService.findAllBrokers(query, companyId);
  }

  @Get('brokers/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async findOneBroker(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.portalsService.findOneBroker(id, companyId);
  }

  @Patch('brokers/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async updateBroker(
    @Param('id') id: string,
    @Body() dto: CreateBrokerDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.portalsService.updateBroker(id, dto, companyId);
  }

  @Delete('brokers/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async deleteBroker(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.portalsService.deleteBroker(id, companyId);
  }

  @Post('complaints')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  async createComplaint(
    @Body() dto: CreateComplaintDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.portalsService.createComplaint(dto, companyId);
  }

  @Get('complaints')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  async findAllComplaints(
    @Query() query: QueryComplaintDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.portalsService.findAllComplaints(query, companyId);
  }

  @Get('complaints/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  async findOneComplaint(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.portalsService.findOneComplaint(id, companyId);
  }

  @Patch('complaints/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  async updateComplaint(
    @Param('id') id: string,
    @Body() dto: UpdateComplaintDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.portalsService.updateComplaint(id, dto, companyId);
  }

  @Delete('complaints/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  async deleteComplaint(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.portalsService.deleteComplaint(id, companyId);
  }

  @Post('complaints/:id/resolve')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  async resolveComplaint(
    @Param('id') id: string,
    @Body() dto: ResolveComplaintDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.portalsService.resolveComplaint(id, dto.resolution, companyId);
  }
}
