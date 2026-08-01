import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { Permissions } from '../../common/auth/permissions';
import { UpdatePermissionGrantsDto } from './dto/update-permission-grants.dto';

@Injectable()
export class PermissionGrantsService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.permissionGrant.findMany({
      where: { companyId },
      include: {
        usersPermissionGrantsUserIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async findByUser(userId: string, companyId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, companyId },
    });
    if (!user) throw new NotFoundException('User not found');

    const grants = await this.prisma.permissionGrant.findMany({
      where: { userId },
    });

    return {
      userId,
      role: user.role,
      allPermissions: Object.values(Permissions),
      grants: grants.map((g) => ({
        permission: g.permission,
        granted: g.granted,
      })),
    };
  }

  async updateUserGrants(
    userId: string,
    dto: UpdatePermissionGrantsDto,
    currentUserId: string,
    companyId: string,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, companyId },
    });
    if (!user) throw new NotFoundException('User not found');

    if (user.role === 'OWNER' && userId !== currentUserId) {
      throw new ForbiddenException('Cannot modify another OWNER grants');
    }

    await this.prisma.$transaction(
      dto.grants.map((g) =>
        this.prisma.permissionGrant.upsert({
          where: {
            companyId_userId_permission: {
              companyId,
              userId,
              permission: g.permission,
            },
          },
          update: { granted: g.granted, grantedById: currentUserId },
          create: {
            userId,
            permission: g.permission,
            granted: g.granted,
            grantedById: currentUserId,
            companyId,
          },
        }),
      ),
    );

    return this.findByUser(userId, companyId);
  }
}
