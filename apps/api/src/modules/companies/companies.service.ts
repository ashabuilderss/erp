import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { EncryptionService } from '../../common/services/encryption.service';
import type { Prisma } from '@prisma/client';
import type { SystemSettings } from './interfaces/company-settings.interface';

@Injectable()
export class CompaniesService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) {}

  async findAll(companyId: string) {
    return this.prisma.company.findMany({
      where: { id: companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async update(id: string, dto: UpdateCompanyDto) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');
    const data: Prisma.CompanyUpdateInput = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.slug !== undefined && { slug: dto.slug }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.settings !== undefined && {
        settings: dto.settings as Prisma.InputJsonValue,
      }),
    };
    return this.prisma.company.update({ where: { id }, data });
  }

  async getSettings(companyId: string): Promise<SystemSettings> {
    const company = await this.findById(companyId);
    const raw = company.settings as Record<string, unknown> | null;
    return {
      debugLogging: (raw?.debugLogging as boolean) ?? false,
      sessionTimeoutMinutes: (raw?.sessionTimeoutMinutes as number) ?? 60,
      passwordMinLength: (raw?.passwordMinLength as number) ?? 8,
      passwordRequireSpecialChar: (raw?.passwordRequireSpecialChar as boolean) ?? false,
      maxLoginAttempts: (raw?.maxLoginAttempts as number) ?? 5,
      encryptSensitiveFields: (raw?.encryptSensitiveFields as boolean) ?? false,
      allowedIpAddresses: (raw?.allowedIpAddresses as string[]) ?? [],
      mfaRequired: (raw?.mfaRequired as boolean) ?? false,
    };
  }

  async updateSettings(companyId: string, dto: UpdateSettingsDto): Promise<SystemSettings> {
    const company = await this.findById(companyId);
    const current = (company.settings as Record<string, unknown>) ?? {};
    const merged: Record<string, unknown> = { ...current };

    const fields: (keyof UpdateSettingsDto)[] = [
      'debugLogging', 'sessionTimeoutMinutes', 'passwordMinLength',
      'passwordRequireSpecialChar', 'maxLoginAttempts',
      'encryptSensitiveFields', 'allowedIpAddresses', 'mfaRequired',
    ];
    for (const field of fields) {
      if (dto[field] !== undefined) {
        merged[field] = dto[field];
      }
    }

    await this.prisma.company.update({
      where: { id: companyId },
      data: { settings: merged as Prisma.InputJsonValue },
    });

    return this.getSettings(companyId);
  }
}
