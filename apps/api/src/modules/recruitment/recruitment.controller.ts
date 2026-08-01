import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RecruitmentService } from './recruitment.service';
import {
  CreateJobPostingDto,
  UpdateJobPostingDto,
  QueryJobPostingDto,
} from './dto/create-job-posting.dto';
import {
  CreateCandidateDto,
  UpdateCandidateDto,
  QueryCandidateDto,
} from './dto/create-candidate.dto';
import { CreateInterviewDto, UpdateInterviewDto } from './dto/create-interview.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permissions } from '../../common/auth/permissions';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('recruitment')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecruitmentController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  // ─── JOB POSTINGS ───────────────────────────────────────────────

  @Get('jobs')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  @RequirePermissions(Permissions.RECRUITMENT_READ)
  async findAllJobs(
    @CurrentUser('companyId') companyId: string,
    @Query() query: QueryJobPostingDto,
  ) {
    return this.recruitmentService.findAllJobs(companyId, query);
  }

  @Post('jobs')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.RECRUITMENT_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async createJob(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateJobPostingDto,
  ) {
    return this.recruitmentService.createJob(dto, companyId);
  }

  @Get('jobs/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  @RequirePermissions(Permissions.RECRUITMENT_READ)
  async findOneJob(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.recruitmentService.findOneJob(id, companyId);
  }

  @Patch('jobs/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.RECRUITMENT_UPDATE)
  async updateJob(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateJobPostingDto,
  ) {
    return this.recruitmentService.updateJob(id, dto, companyId);
  }

  @Delete('jobs/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.RECRUITMENT_UPDATE)
  @HttpCode(HttpStatus.OK)
  async removeJob(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.recruitmentService.removeJob(id, companyId);
  }

  // ─── CANDIDATES ─────────────────────────────────────────────────

  @Get('candidates')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  @RequirePermissions(Permissions.RECRUITMENT_READ)
  async findAllCandidates(
    @CurrentUser('companyId') companyId: string,
    @Query() query: QueryCandidateDto,
  ) {
    return this.recruitmentService.findAllCandidates(companyId, query);
  }

  @Post('candidates')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.RECRUITMENT_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async createCandidate(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateCandidateDto,
  ) {
    return this.recruitmentService.createCandidate(dto, companyId);
  }

  @Get('candidates/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  @RequirePermissions(Permissions.RECRUITMENT_READ)
  async findOneCandidate(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.recruitmentService.findOneCandidate(id, companyId);
  }

  @Patch('candidates/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.RECRUITMENT_UPDATE)
  async updateCandidate(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCandidateDto,
  ) {
    return this.recruitmentService.updateCandidate(id, dto, companyId);
  }

  // ─── INTERVIEWS ─────────────────────────────────────────────────

  @Post('candidates/:id/interviews')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.RECRUITMENT_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async scheduleInterview(
    @CurrentUser('companyId') companyId: string,
    @Param('id') candidateId: string,
    @Body() dto: CreateInterviewDto,
  ) {
    return this.recruitmentService.scheduleInterview(candidateId, dto, companyId);
  }

  @Patch('interviews/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.RECRUITMENT_UPDATE)
  async updateInterview(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateInterviewDto,
  ) {
    return this.recruitmentService.updateInterview(id, dto, companyId);
  }
}
