import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import { CreateDeviceRegistrationDto } from './dto/create-device-registration.dto';
import { QueryDeviceRegistrationDto } from './dto/query-device-registration.dto';

@Injectable()
export class DeviceRegistrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateDeviceRegistrationDto,
    employeeId: string,
    companyId: string,
  ) {
    const existing = await this.prisma.deviceRegistration.findUnique({
      where: { companyId_employeeId_deviceId: { companyId, employeeId, deviceId: dto.deviceId } },
    });
    if (existing) {
      throw new ConflictException('Device already registered');
    }
    return this.prisma.deviceRegistration.create({
      data: {
        employeeId,
        companyId,
        deviceName: dto.deviceName,
        deviceId: dto.deviceId,
        isTrusted: dto.isTrusted ?? false,
      },
    });
  }

  async findAll(query: QueryDeviceRegistrationDto, companyId: string) {
    const where: any = { companyId };
    if (query.search) {
      where.OR = [
        { deviceName: { contains: query.search, mode: 'insensitive' } },
        { deviceId: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const total = await this.prisma.deviceRegistration.count({ where });
    const data = await this.prisma.deviceRegistration.findMany({
      where,
      skip: ((query.page ?? 1) - 1) * (query.limit ?? 10),
      take: query.limit ?? 10,
      include: {
        employee: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return {
      data,
      meta: {
        total,
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        totalPages: Math.ceil(total / (query.limit ?? 10)),
      },
    };
  }

  async findMyDevices(employeeId: string) {
    return this.prisma.deviceRegistration.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const device = await this.prisma.deviceRegistration.findFirst({
      where: { id, companyId },
      include: {
        employee: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });
    if (!device) throw new NotFoundException('Device registration not found');
    return device;
  }

  async update(
    id: string,
    dto: Partial<CreateDeviceRegistrationDto>,
    companyId: string,
  ) {
    await this.findOne(id, companyId);
    return this.prisma.deviceRegistration.update({ where: { id }, data: dto });
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.deviceRegistration.delete({ where: { id } });
  }
}
