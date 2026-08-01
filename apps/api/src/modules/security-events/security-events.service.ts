import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { QuerySecurityEventDto } from './dto/query-security-event.dto';

@Injectable()
export class SecurityEventsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    companyId: string;
    eventType: string;
    severity: string;
    description?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
  }) {
    return this.prisma.securityEvent.create({
      data: {
        companyId: data.companyId,
        eventType: data.eventType,
        severity: data.severity,
        description: data.description ?? '',
        userId: data.userId,
        metadata: (data.metadata ?? {}) as any,
        ipAddress: data.ipAddress,
      },
    });
  }

  async findAll(query: QuerySecurityEventDto, companyId: string) {
    const { page = 1, limit = 20, eventType, severity } = query;

    const where: Record<string, unknown> = { companyId };
    if (eventType) where.eventType = eventType;
    if (severity) where.severity = severity;

    const [data, total] = await Promise.all([
      this.prisma.securityEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.securityEvent.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findLoginHistory(companyId: string) {
    const events = await this.prisma.securityEvent.findMany({
      where: {
        companyId,
        eventType: { in: ['LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGIN_ATTEMPT'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return {
      data: events.map((e) => {
        const metadata = e.metadata as Record<string, any> | null;
        return {
          id: e.id,
          email:
            metadata && typeof metadata === 'object' && 'email' in metadata
              ? String(metadata.email)
              : (e.userId ?? 'unknown'),
          status: e.eventType === 'LOGIN_SUCCESS' ? 'success' : 'failed',
          reason: e.description ?? null,
          createdAt: e.createdAt.toISOString(),
        };
      }),
      meta: { total: events.length },
    };
  }

  async findSessions(companyId: string) {
    const tokens = await this.prisma.refreshToken.findMany({
      where: { companyId, revokedAt: null, expiresAt: { gte: new Date() } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { users: { select: { email: true } } },
    });

    return tokens.map((t) => ({
      id: t.id,
      email: t.users?.email ?? 'unknown',
      createdAt: t.createdAt.toISOString(),
    }));
  }
}
