import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import {
  CreateEscalationRuleDto,
  UpdateEscalationRuleDto,
} from './dto/create-escalation-rule.dto';

@Injectable()
export class EscalationRulesService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.escalationRule.findMany({
      where: { companyId },
      orderBy: { level: 'asc' },
    });
  }

  async create(dto: CreateEscalationRuleDto, companyId: string) {
    return this.prisma.escalationRule.create({
      data: {
        companyId,
        name: dto.name,
        triggerType: dto.triggerType,
        config: dto.config as any,
        level: dto.level,
        notifyRoles: dto.notifyRoles,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateEscalationRuleDto, companyId: string) {
    const rule = await this.prisma.escalationRule.findFirst({
      where: { id, companyId },
    });
    if (!rule) throw new NotFoundException('Escalation rule not found');

    return this.prisma.escalationRule.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.triggerType !== undefined && { triggerType: dto.triggerType }),
        ...(dto.config !== undefined && { config: dto.config as any }),
        ...(dto.level !== undefined && { level: dto.level }),
        ...(dto.notifyRoles !== undefined && { notifyRoles: dto.notifyRoles }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async remove(id: string, companyId: string) {
    const rule = await this.prisma.escalationRule.findFirst({
      where: { id, companyId },
    });
    if (!rule) throw new NotFoundException('Escalation rule not found');

    return this.prisma.escalationRule.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
