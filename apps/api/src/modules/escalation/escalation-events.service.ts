import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class EscalationEventsService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, status?: string) {
    return this.prisma.escalationEvent.findMany({
      where: {
        companyId,
        ...(status && { status: status as any }),
      },
      orderBy: { triggeredAt: 'desc' },
      include: {
        escalationRules: {
          select: { name: true, triggerType: true, level: true },
        },
      },
    });
  }

  async resolve(id: string, companyId: string) {
    const event = await this.prisma.escalationEvent.findFirst({
      where: { id, companyId },
    });
    if (!event) throw new NotFoundException('Escalation event not found');

    return this.prisma.escalationEvent.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
    });
  }
}
