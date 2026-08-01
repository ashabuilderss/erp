import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { AnnouncementService } from './announcement.service';
import { AnnouncementReceiptService } from './announcement-receipt.service';
import {
  CreateAnnouncementDto,
  PublishAnnouncementDto,
  ArchiveAnnouncementDto,
} from './dto/create-announcement.dto';
import { QueryAnnouncementDto } from './dto/query-announcement.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permissions } from '../../common/auth/permissions';
import {
  CurrentUser,
  CurrentCompany,
} from '../../common/decorators/current-user.decorator';
import { UserRole, AnnouncementStatus } from '@prisma/client';
import { UseIdempotency } from '../../common/decorators/idempotency.decorator';

@Controller('announcements')
export class AnnouncementController {
  constructor(
    private readonly announcementService: AnnouncementService,
    private readonly receiptService: AnnouncementReceiptService,
  ) {}

  @Post()
  @UseIdempotency()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.ANNOUNCEMENT_CREATE)
  async create(
    @Body() dto: CreateAnnouncementDto,
    @CurrentCompany('id') companyId: string,
    @CurrentUser('id') userId: string,
  ) {
    const id = await this.announcementService.create({
      companyId,
      title: dto.title,
      body: dto.body,
      priority: dto.priority,
      targetRoles: dto.targetRoles,
      targetEmployees: dto.targetEmployees,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      createdById: userId,
    });
    return this.announcementService.getAnnouncement(id, companyId);
  }

  @Post('publish')
  @UseIdempotency()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.ANNOUNCEMENT_PUBLISH)
  async publish(
    @Body() dto: PublishAnnouncementDto,
    @CurrentCompany('id') companyId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.announcementService.publish({
      companyId,
      announcementId: dto.announcementId,
      userId,
    });
    return { success: true };
  }

  @Post('archive')
  @UseIdempotency()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.ANNOUNCEMENT_ARCHIVE)
  async archive(
    @Body() dto: ArchiveAnnouncementDto,
    @CurrentCompany('id') companyId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.announcementService.archive({
      companyId,
      announcementId: dto.announcementId,
      userId,
    });
    return { success: true };
  }

  @Post(':id/read')
  @UseIdempotency()
  @Roles(UserRole.EMPLOYEE, UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.ANNOUNCEMENT_READ)
  async markRead(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.receiptService.markRead({
      companyId,
      announcementId: id,
      userId,
    });
    return { success: true };
  }

  @Post(':id/acknowledge')
  @UseIdempotency()
  @Roles(UserRole.EMPLOYEE, UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.ANNOUNCEMENT_READ)
  async acknowledge(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.receiptService.acknowledge({
      companyId,
      announcementId: id,
      userId,
    });
    return { success: true };
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.ANNOUNCEMENT_READ)
  async list(
    @CurrentCompany('id') companyId: string,
    @Query() query: QueryAnnouncementDto,
  ) {
    return this.announcementService.listAnnouncements(companyId, {
      page: query.page,
      limit: query.limit,
      status: query.status,
    });
  }

  @Get('my')
  @Roles(UserRole.EMPLOYEE, UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER, UserRole.TEAM_LEAD, UserRole.ACCOUNTS, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.ANNOUNCEMENT_READ)
  async myAnnouncements(
    @CurrentCompany('id') companyId: string,
    @CurrentUser('id') userId: string,
  ) {
    const employee = await this.announcementService[
      'prisma'
    ].employee.findFirst({
      where: { userId, companyId },
    });
    if (!employee) return [];
    return this.announcementService.getPublishedForEmployee(
      companyId,
      employee.id,
    );
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.ANNOUNCEMENT_READ)
  async getOne(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.announcementService.getAnnouncement(id, companyId);
  }

  @Get(':id/receipts')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.ANNOUNCEMENT_READ)
  async getReceipts(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    const [receipts, counts] = await Promise.all([
      this.receiptService.getReceipts(id, companyId),
      this.receiptService.getReceiptCounts(id, companyId),
    ]);
    return { receipts, counts };
  }
}
