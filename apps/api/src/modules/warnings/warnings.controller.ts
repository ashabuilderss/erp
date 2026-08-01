import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permissions } from '../../common/auth/permissions';
import { WarningsService } from './warnings.service';
import { IssueWarningDto } from './dto/warnings.dto';
import { QueryWarningDto } from './dto/query-warning.dto';
import { UserRole } from '@prisma/client';
import { UseIdempotency } from '../../common/decorators/idempotency.decorator';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';

@Controller('warnings')
@UseGuards(JwtAuthGuard)
export class WarningsController {
  constructor(private readonly warningsService: WarningsService) {}

  @Post()
  @UseIdempotency()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  @RequirePermissions(Permissions.WARNING_CREATE)
  async issueWarning(@Request() req: AuthenticatedRequest, @Body() dto: IssueWarningDto) {
    return await this.warningsService.issueWarning(
      req.user.companyId,
      req.user.id,
      dto,
    );
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.WARNING_READ)
  async findAll(@Request() req: AuthenticatedRequest, @Query() query: QueryWarningDto) {
    return await this.warningsService.findAll(req.user.companyId, query);
  }

  @Get('me')
  @RequirePermissions(Permissions.WARNING_READ)
  async findMyWarnings(@Request() req: AuthenticatedRequest, @Query() query: QueryWarningDto) {
    return await this.warningsService.findMyWarnings(
      req.user.companyId,
      req.user.id,
      query,
    );
  }

  @Get(':id')
  @RequirePermissions(Permissions.WARNING_READ)
  async findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return await this.warningsService.findOne(req.user.companyId, id);
  }

  @Post(':id/acknowledge')
  @UseIdempotency()
  @RequirePermissions(Permissions.WARNING_ACKNOWLEDGE)
  async acknowledgeWarning(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return await this.warningsService.acknowledgeWarning(
      req.user.companyId,
      id,
      req.user.id,
    );
  }
}
