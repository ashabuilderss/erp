"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceRegistrationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../config/prisma.service");
let DeviceRegistrationsService = class DeviceRegistrationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, employeeId, companyId) {
        const existing = await this.prisma.deviceRegistration.findUnique({
            where: {
                companyId_employeeId_deviceId: {
                    companyId,
                    employeeId,
                    deviceId: dto.deviceId,
                },
            },
        });
        if (existing) {
            throw new common_1.ConflictException('Device already registered');
        }
        return this.prisma.deviceRegistration.create({
            data: {
                employeeId,
                companyId,
                deviceName: dto.deviceName,
                deviceId: dto.deviceId,
                isTrusted: false,
            },
        });
    }
    async findAll(query, companyId) {
        const where = { companyId };
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
                employees: {
                    include: { users: { select: { firstName: true, lastName: true } } },
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
    async findMyDevices(employeeId) {
        return this.prisma.deviceRegistration.findMany({
            where: { employeeId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id, companyId) {
        const device = await this.prisma.deviceRegistration.findFirst({
            where: { id, companyId },
            include: {
                employees: {
                    include: { users: { select: { firstName: true, lastName: true } } },
                },
            },
        });
        if (!device)
            throw new common_1.NotFoundException('Device registration not found');
        return device;
    }
    async update(id, dto, companyId) {
        await this.findOne(id, companyId);
        return this.prisma.deviceRegistration.update({ where: { id }, data: dto });
    }
    async remove(id, companyId) {
        await this.findOne(id, companyId);
        return this.prisma.deviceRegistration.update({ where: { id }, data: { deletedAt: new Date() } });
    }
};
exports.DeviceRegistrationsService = DeviceRegistrationsService;
exports.DeviceRegistrationsService = DeviceRegistrationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DeviceRegistrationsService);
//# sourceMappingURL=device-registrations.service.js.map