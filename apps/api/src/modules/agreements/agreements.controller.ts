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
import { AgreementsService } from './agreements.service';
import {
  CreateAgreementDto,
  UpdateAgreementDto,
  QueryAgreementDto,
  ApproveStepDto,
} from './dto/create-agreement.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permissions } from '../../common/auth/permissions';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { UseIdempotency } from '../../common/decorators/idempotency.decorator';

@Controller('agreements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgreementsController {
  constructor(private readonly agreementsService: AgreementsService) {}

  // ─── LIST ────────────────────────────────────────────────────────

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  @RequirePermissions(Permissions.AGREEMENT_READ)
  async findAll(
    @CurrentUser('companyId') companyId: string,
    @Query() query: QueryAgreementDto,
  ) {
    return this.agreementsService.findAll(companyId, query);
  }

  // ─── CREATE ──────────────────────────────────────────────────────

  @Post()
  @UseIdempotency()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.AGREEMENT_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAgreementDto,
  ) {
    return this.agreementsService.create(dto, userId, companyId);
  }

  // ─── GET ONE ─────────────────────────────────────────────────────

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  @RequirePermissions(Permissions.AGREEMENT_READ)
  async findOne(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.agreementsService.findOne(id, companyId);
  }

  // ─── UPDATE ──────────────────────────────────────────────────────

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.AGREEMENT_CREATE)
  async update(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAgreementDto,
  ) {
    return this.agreementsService.update(id, dto, companyId);
  }

  // ─── SOFT DELETE ─────────────────────────────────────────────────

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.AGREEMENT_CREATE)
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.agreementsService.remove(id, companyId);
  }

  // ─── SUBMIT FOR APPROVAL ────────────────────────────────────────

  @Post(':id/submit')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.AGREEMENT_CREATE)
  @HttpCode(HttpStatus.OK)
  async submit(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.agreementsService.submit(id, companyId);
  }

  // ─── APPROVE A STEP ─────────────────────────────────────────────

  @Post(':id/approve')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  @RequirePermissions(Permissions.AGREEMENT_APPROVE)
  @HttpCode(HttpStatus.OK)
  async approve(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: ApproveStepDto,
  ) {
    return this.agreementsService.approve(id, userId, companyId, dto.comments);
  }

  // ─── ARCHIVE ────────────────────────────────────────────────────

  @Post(':id/archive')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.AGREEMENT_APPROVE)
  @HttpCode(HttpStatus.OK)
  async archive(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.agreementsService.archive(id, companyId);
  }
}
