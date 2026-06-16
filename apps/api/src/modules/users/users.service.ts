import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../config/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { Prisma, UserRole } from '@prisma/client';
import { safeSortBy } from '../../common/utils/sort-by';

const ALLOWED_SORT = [
  'createdAt',
  'updatedAt',
  'email',
  'firstName',
  'lastName',
  'role',
  'isActive',
] as const;

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: QueryUserDto, companyId: string) {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.UserWhereInput = { companyId };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) where.role = role as UserRole;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { [safeSortBy(sortBy, ALLOWED_SORT, 'createdAt')]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              department: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, companyId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, companyId },
      include: {
        employee: { include: { department: true, designation: true } },
      },
    });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  async update(id: string, dto: UpdateUserDto, companyId: string) {
    await this.findOne(id, companyId);
    const updated = await this.prisma.user.update({
      where: { id },
      data: dto,
      include: {
        employee: { select: { id: true, employeeCode: true } },
      },
    });
    this.eventEmitter.emit('user.updated', { companyId, entityId: id });
    return updated;
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
    this.eventEmitter.emit('user.updated', { companyId, entityId: id });
    return updated;
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true },
    });

    const current =
      (existing?.notificationPreferences as Record<string, boolean> | null) ??
      {};
    const merged = { ...current, ...dto };

    return this.prisma.user.update({
      where: { id: userId },
      data: { notificationPreferences: merged },
      select: { notificationPreferences: true },
    });
  }
}
