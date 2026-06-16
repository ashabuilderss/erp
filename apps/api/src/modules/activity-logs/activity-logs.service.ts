import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { QueryActivityLogDto } from './dto/query-activity-log.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ActivityLogsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryActivityLogDto, companyId: string) {
    const {
      page = 1,
      limit = 20,
      search,
      action,
      entityType,
      performedById,
    } = query;

    const where: Prisma.ActivityLogWhereInput = { companyId };

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { entityType: { contains: search, mode: 'insensitive' } },
        { entityId: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (entityType) where.entityType = entityType;
    if (performedById) where.performedById = performedById;

    const [data, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          performedBy: { include: { user: true } },
        },
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
