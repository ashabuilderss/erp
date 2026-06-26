import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../config/prisma.service';
import { EncryptionService } from '../../common/services/encryption.service';
import * as otplib from 'otplib';
import * as QRCode from 'qrcode';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';

const TEMP_TOKEN_EXPIRY_MINUTES = 5;
const BCRYPT_ROUNDS = 12;

@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private encryptionService: EncryptionService,
  ) {}

  private encryptSecret(plaintext: string): string {
    return this.encryptionService.encrypt(plaintext);
  }

  private decryptSecret(encrypted: string): string {
    try {
      return this.encryptionService.decrypt(encrypted);
    } catch {
      return encrypted;
    }
  }

  private isEncrypted(value: string): boolean {
    return value.startsWith('enc:') || value.includes(':');
  }

  async setup(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    if (user.totpEnabled) throw new BadRequestException('2FA already enabled');

    const secret = otplib.generateSecret();
    const issuer = 'AshaBuilders';
    const otpauthUrl = otplib.generateURI({
      strategy: 'totp',
      issuer,
      label: user.email,
      secret,
    });

    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpSecret: this.encryptSecret(secret) },
    });

    return { secret, qrCodeUrl, otpauthUrl };
  }

  async verify(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.totpSecret)
      throw new BadRequestException('2FA not set up');
    if (user.totpEnabled) throw new BadRequestException('2FA already enabled');

    const decrypted = this.decryptSecret(user.totpSecret);
    const isValid = await otplib.verify({ token, secret: decrypted });
    if (!isValid) throw new BadRequestException('Invalid verification code');

    const backupCodes = Array.from({ length: 8 }, () =>
      randomBytes(4).toString('hex'),
    );
    const hashedCodes = await Promise.all(
      backupCodes.map((c) => bcrypt.hash(c, BCRYPT_ROUNDS)),
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        totpEnabled: true,
        totpVerifiedAt: new Date(),
        backupCodes: hashedCodes,
      },
    });

    return { backupCodes };
  }

  async disable(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.hashedPassword)
      throw new BadRequestException('User not found');
    if (!user.totpEnabled) throw new BadRequestException('2FA not enabled');

    const valid = await bcrypt.compare(password, user.hashedPassword);
    if (!valid) throw new BadRequestException('Invalid password');

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        totpSecret: null,
        totpEnabled: false,
        totpVerifiedAt: null,
        backupCodes: Prisma.NullableJsonNullValueInput.DbNull,
      },
    });

    return { message: '2FA disabled' };
  }

  async generateBackupCodes(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.totpEnabled)
      throw new BadRequestException('2FA not enabled');

    const backupCodes = Array.from({ length: 8 }, () =>
      randomBytes(4).toString('hex'),
    );
    const hashedCodes = await Promise.all(
      backupCodes.map((c) => bcrypt.hash(c, BCRYPT_ROUNDS)),
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: { backupCodes: hashedCodes },
    });

    return { backupCodes };
  }

  private async createTempToken(userId: string, companyId: string) {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + TEMP_TOKEN_EXPIRY_MINUTES);

    await this.prisma.tempToken.create({
      data: { token, userId, companyId, expiresAt },
    });
    return token;
  }

  async generateChallenge(userId: string, companyId: string) {
    const tempToken = await this.createTempToken(userId, companyId);
    return { requiresTwoFactor: true, tempToken };
  }

  async authenticate(tempTokenStr: string, token: string) {
    const stored = await this.prisma.tempToken.findUnique({
      where: { token: tempTokenStr },
    });
    if (!stored || stored.usedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired temporary token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: stored.userId },
    });
    if (!user || !user.totpEnabled || !user.totpSecret) {
      throw new UnauthorizedException('2FA not enabled');
    }

    const decrypted = this.decryptSecret(user.totpSecret);
    const isValid = await otplib.verify({ token, secret: decrypted });
    if (!isValid) {
      if (user.backupCodes) {
        const codes = user.backupCodes as string[];
        for (let i = 0; i < codes.length; i++) {
          const match = await bcrypt.compare(token, codes[i]);
          if (match) {
            codes.splice(i, 1);
            await this.prisma.user.update({
              where: { id: user.id },
              data: { backupCodes: codes },
            });
            await this.prisma.tempToken.update({
              where: { id: stored.id },
              data: { usedAt: new Date() },
            });
            const employee = await this.prisma.employee.findUnique({
              where: { userId: user.id },
              select: { id: true },
            });
            const payload = {
              sub: user.id,
              email: user.email,
              role: user.role,
              companyId: user.companyId,
              employeeId: employee?.id ?? null,
            };
            return {
              accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
              backupCodeUsed: true,
              user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                companyId: user.companyId,
                employeeId: employee?.id ?? null,
              },
            };
          }
        }
      }
      throw new UnauthorizedException('Invalid verification code');
    }

    await this.prisma.tempToken.update({
      where: { id: stored.id },
      data: { usedAt: new Date() },
    });

    const employee = await this.prisma.employee.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      employeeId: employee?.id ?? null,
    };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

    return {
      accessToken,
      expiresIn: 900,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId,
        employeeId: employee?.id ?? null,
      },
    };
  }
}
