import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { DocumentRegistryService } from './document-registry.service';
import { DocumentAccessService } from './document-access.service';
import {
  RegisterDocumentDto,
  DeleteDocumentDto,
  LogDocumentAccessDto,
} from './dto/document.dto';
import { QueryDocumentDto, QueryAccessLogDto } from './dto/query-document.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permissions } from '../../common/auth/permissions';
import {
  CurrentUser,
  CurrentCompany,
} from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { UseIdempotency } from '../../common/decorators/idempotency.decorator';

@Controller('documents')
export class DocumentController {
  constructor(
    private readonly documentRegistryService: DocumentRegistryService,
    private readonly accessService: DocumentAccessService,
  ) {}

  @Post()
  @UseIdempotency()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.DOCUMENT_CREATE)
  async register(
    @Body() dto: RegisterDocumentDto,
    @CurrentCompany('id') companyId: string,
    @CurrentUser('id') userId: string,
  ) {
    const id = await this.documentRegistryService.register({
      companyId,
      name: dto.name,
      fileType: dto.fileType,
      fileSize: dto.fileSize,
      category: dto.category,
      storageObjectId: dto.storageObjectId,
      uploadedById: userId,
      accessLevel: dto.accessLevel,
    });
    return this.documentRegistryService.getDocument(id, companyId);
  }

  @Post('access')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.TEAM_LEAD, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.DOCUMENT_READ)
  async logAccess(
    @Body() dto: LogDocumentAccessDto,
    @CurrentCompany('id') companyId: string,
    @CurrentUser('id') userId: string,
  ) {
    const id = await this.accessService.logAccess({
      companyId,
      documentId: dto.documentId,
      userId,
      action: dto.action,
    });
    return { id };
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.ACCOUNTS, UserRole.MANAGER, UserRole.TEAM_LEAD, UserRole.EMPLOYEE, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.DOCUMENT_READ)
  async list(
    @CurrentCompany('id') companyId: string,
    @Query() query: QueryDocumentDto,
  ) {
    return this.documentRegistryService.listDocuments(companyId, {
      page: query.page,
      limit: query.limit,
      category: query.category,
    });
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.ACCOUNTS, UserRole.MANAGER, UserRole.TEAM_LEAD, UserRole.EMPLOYEE, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.DOCUMENT_READ)
  async getOne(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.documentRegistryService.getDocument(id, companyId);
  }

  @Get(':id/access-logs')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.ACCOUNTS, UserRole.MANAGER, UserRole.TEAM_LEAD, UserRole.EMPLOYEE, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.DOCUMENT_READ)
  async getAccessLogs(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
    @Query() query: QueryAccessLogDto,
  ) {
    return this.accessService.getAccessLogs(id, companyId, {
      page: query.page,
      limit: query.limit,
    });
  }

  @Get(':id/access-stats')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.ACCOUNTS, UserRole.MANAGER, UserRole.TEAM_LEAD, UserRole.EMPLOYEE, UserRole.FIELD_EMPLOYEE)
  @RequirePermissions(Permissions.DOCUMENT_READ)
  async getAccessStats(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.accessService.getAccessStats(id, companyId);
  }

  @Post(':id/delete')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.DOCUMENT_DELETE)
  async delete(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.documentRegistryService.delete({
      companyId,
      documentId: id,
      userId,
    });
    return { success: true };
  }
}
