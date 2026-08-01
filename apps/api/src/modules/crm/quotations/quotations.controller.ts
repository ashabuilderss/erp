import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  Res,
  ForbiddenException,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Permissions } from '../../../common/auth/permissions';
import { UserRole } from '@prisma/client';
import { QuotationsService } from './quotations.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { QueryQuotationDto } from './dto/query-quotation.dto';
import { UpdateQuotationStatusDto } from './dto/update-quotation-status.dto';
import {
  CurrentCompany,
  CurrentEmployeeId,
  CurrentUser,
} from '../../../common/decorators/current-user.decorator';
import { AuthenticatedRequest } from '../../../common/interfaces/request.interface';
import { UseIdempotency } from '../../../common/decorators/idempotency.decorator';

@Controller('quotations')
@UseGuards(JwtAuthGuard)
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Post()
  @UseIdempotency()
  @RequirePermissions(Permissions.QUOTATION_CREATE)
  async create(
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() employeeId: string,
    @Body() dto: CreateQuotationDto,
  ) {
    return await this.quotationsService.create(companyId, employeeId, dto);
  }

  @Get()
  @RequirePermissions(Permissions.QUOTATION_READ)
  async findAll(
    @CurrentCompany('id') companyId: string,
    @Query() query: QueryQuotationDto,
  ) {
    return await this.quotationsService.findAll(companyId, query);
  }

  @Get(':id')
  @RequirePermissions(Permissions.QUOTATION_READ)
  async findOne(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return await this.quotationsService.findOne(
      companyId,
      id,
      req.user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Patch(':id/status')
  @RequirePermissions(Permissions.QUOTATION_UPDATE)
  async updateStatus(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
    @Body() dto: UpdateQuotationStatusDto,
  ) {
    return await this.quotationsService.updateStatus(companyId, id, dto);
  }

  @Get(':id/download')
  @RequirePermissions(Permissions.QUOTATION_DOWNLOAD)
  async downloadPdf(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
    @Request() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.quotationsService.downloadPdf(
      companyId,
      id,
      req.user.id,
      req.user.email,
      req.ip,
      req.headers['user-agent'],
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="quotation-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Get(':id/access-logs')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.QUOTATION_READ)
  async getAccessLogs(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return await this.quotationsService.getAccessLogs(companyId, id);
  }
}
