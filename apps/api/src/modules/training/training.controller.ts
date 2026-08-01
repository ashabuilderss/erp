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
import { TrainingService } from './training.service';
import {
  CreateSopDto,
  UpdateSopDto,
  AcknowledgeSopDto,
  QuerySopDto,
} from './dto/create-sop.dto';
import {
  CreateTrainingRecordDto,
  QueryTrainingRecordDto,
} from './dto/create-training-record.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permissions } from '../../common/auth/permissions';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('training')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrainingController {
  constructor(private readonly service: TrainingService) {}

  // ─── SOP DOCUMENTS ────────────────────────────────────────────────

  @Get('sops')
  @Roles(
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
  )
  @RequirePermissions(Permissions.TRAINING_READ)
  async findAllSops(
    @CurrentUser('companyId') companyId: string,
    @Query() query: QuerySopDto,
  ) {
    return this.service.findAllSops(companyId, query);
  }

  @Post('sops')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.TRAINING_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async createSop(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateSopDto,
  ) {
    return this.service.createSop(companyId, dto);
  }

  @Get('sops/:id')
  @Roles(
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
  )
  @RequirePermissions(Permissions.TRAINING_READ)
  async findOneSop(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.service.findOneSop(companyId, id);
  }

  @Patch('sops/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.TRAINING_CREATE)
  async updateSop(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSopDto,
  ) {
    return this.service.updateSop(companyId, id, dto);
  }

  @Delete('sops/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.TRAINING_CREATE)
  async removeSop(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.service.removeSop(companyId, id);
  }

  // ─── SOP ACKNOWLEDGEMENTS ─────────────────────────────────────────

  @Post('sops/:id/acknowledge')
  @Roles(
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.EMPLOYEE,
  )
  @RequirePermissions(Permissions.TRAINING_ACKNOWLEDGE)
  @HttpCode(HttpStatus.CREATED)
  async acknowledgeSop(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('employeeId') currentEmployeeId: string,
    @Param('id') id: string,
    @Body() dto: AcknowledgeSopDto,
  ) {
    const employeeId = dto.employeeId || currentEmployeeId;
    return this.service.acknowledgeSop(companyId, id, employeeId);
  }

  @Get('sops/:id/acknowledgements')
  @Roles(
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.MANAGER,
  )
  @RequirePermissions(Permissions.TRAINING_READ)
  async listAcknowledgements(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.service.listAcknowledgements(companyId, id);
  }

  // ─── TRAINING RECORDS ─────────────────────────────────────────────

  @Get('records')
  @Roles(
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
  )
  @RequirePermissions(Permissions.TRAINING_READ)
  async findAllRecords(
    @CurrentUser('companyId') companyId: string,
    @Query() query: QueryTrainingRecordDto,
  ) {
    return this.service.findAllRecords(companyId, query);
  }

  @Post('records')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.TRAINING_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async createRecord(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateTrainingRecordDto,
  ) {
    return this.service.createRecord(companyId, dto);
  }
}
