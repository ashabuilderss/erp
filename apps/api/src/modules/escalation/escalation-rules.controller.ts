import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { EscalationRulesService } from './escalation-rules.service';
import {
  CreateEscalationRuleDto,
  UpdateEscalationRuleDto,
} from './dto/create-escalation-rule.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentCompany } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('escalation-rules')
export class EscalationRulesController {
  constructor(private readonly service: EscalationRulesService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async findAll(@CurrentCompany('id') companyId: string) {
    return this.service.findAll(companyId);
  }

  @Post()
  @Roles(UserRole.OWNER)
  async create(
    @Body() dto: CreateEscalationRuleDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.create(dto, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEscalationRuleDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.update(id, dto, companyId);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  async remove(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.service.remove(id, companyId);
  }
}
