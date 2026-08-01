import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';

export interface CreateFollowUpDto {
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE';
  outcome?: string;
  nextFollowUpDate?: string;
  notes: string;
}

@Injectable()
export class LeadFollowUpService {
  constructor(private readonly prisma: PrismaService) {}

  async logFollowUp(
    leadId: string,
    companyId: string,
    userId: string,
    dto: CreateFollowUpDto,
  ) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId, companyId, deletedAt: null },
    });
    if (!lead) throw new NotFoundException('Lead not found');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true },
    });

    const entry = await this.prisma.activityLog.create({
      data: {
        action: 'LEAD_FOLLOW_UP',
        entityType: 'Lead',
        entityId: leadId,
        companyId,
        performedById: userId,
        actorName: user ? `${user.firstName} ${user.lastName}` : null,
        actorEmail: user?.email ?? null,
        description: `[${dto.type}] ${dto.notes}`,
        metadata: {
          followUpType: dto.type,
          outcome: dto.outcome ?? null,
          nextFollowUpDate: dto.nextFollowUpDate ?? null,
          notes: dto.notes,
        },
      },
    });

    if (dto.nextFollowUpDate) {
      await this.prisma.lead.update({
        where: { id: leadId },
        data: { notes: `Next follow-up: ${dto.nextFollowUpDate} — ${dto.notes}` },
      });
    }

    return entry;
  }

  async getFollowUps(leadId: string, companyId: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId, companyId, deletedAt: null },
    });
    if (!lead) throw new NotFoundException('Lead not found');

    return this.prisma.activityLog.findMany({
      where: {
        entityType: 'Lead',
        entityId: leadId,
        companyId,
        action: 'LEAD_FOLLOW_UP',
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
