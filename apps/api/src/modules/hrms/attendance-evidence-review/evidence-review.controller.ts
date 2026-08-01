import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { EvidenceReviewService } from './evidence-review.service';
import { CreateEvidenceReviewDto } from './dto/create-evidence-review.dto';
import { QueryEvidenceReviewDto } from './dto/query-evidence-review.dto';
import { ReviewEvidenceDto } from './dto/review-evidence.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { Permissions } from '../../../common/auth/permissions';
import {
  CurrentCompany,
  CurrentUser,
} from '../../../common/decorators/current-user.decorator';
import { UserRole, EvidenceReviewStatus } from '@prisma/client';

@Controller('evidence-reviews')
export class EvidenceReviewController {
  constructor(private readonly service: EvidenceReviewService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.ATTENDANCE_CREATE)
  create(
    @Body() dto: CreateEvidenceReviewDto,
    @CurrentCompany('id') companyId: string,
    @CurrentUser('id') reviewerId: string,
  ) {
    return this.service.create(dto, companyId, reviewerId);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  @RequirePermissions(Permissions.ATTENDANCE_READ)
  findAll(
    @Query() query: QueryEvidenceReviewDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.findAll(query, companyId);
  }

  @Get('queue')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  @RequirePermissions(Permissions.ATTENDANCE_READ)
  queue(@CurrentCompany('id') companyId: string) {
    return this.service.findAll(
      { status: EvidenceReviewStatus.PENDING },
      companyId,
    );
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  @RequirePermissions(Permissions.ATTENDANCE_READ)
  findOne(@Param('id') id: string, @CurrentCompany('id') companyId: string) {
    return this.service.findOne(id, companyId);
  }

  @Get(':id/view')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  @RequirePermissions(Permissions.ATTENDANCE_READ)
  view(@Param('id') id: string, @CurrentCompany('id') companyId: string) {
    return this.service.getForView(id, companyId);
  }

  @Patch(':id/review')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.ATTENDANCE_APPROVE)
  review(
    @Param('id') id: string,
    @Body() dto: ReviewEvidenceDto,
    @CurrentCompany('id') companyId: string,
    @CurrentUser('id') reviewerId: string,
  ) {
    return this.service.review(id, dto, companyId, reviewerId);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.ATTENDANCE_VERIFY)
  remove(@Param('id') id: string, @CurrentCompany('id') companyId: string) {
    return this.service.remove(id, companyId);
  }
}
