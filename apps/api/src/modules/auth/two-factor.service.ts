import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../config/prisma.service';
import { EncryptionService } from '../../common/services/encryption.service';
import * as QRCode from 'qrcode';
import * as bcrypt from 'bcrypt';
import { createHmac, randomBytes, createHash } from 'crypto';
import { Prisma } from '@prisma/client';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function generateTotpSecret(length = 20): string {
  const bytes = randomBytes(length);
  let secret = '';
  for (let i = 0; i < bytes.length; i++) {
    secret += ALPHABET[bytes[i] % 32];
  }
  return secret;
}

function generateTotpURI(options: { issuer: string; label: string; secret: string }): string {
  const label = encodeURIComponent(options.label);
  const issuer = encodeURIComponent(options.issuer);
  return `otpauth://totp/${issuer}:${label}?secret=${options.secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

function base32Decode(base32Str: string): Buffer {
  let bits = '';
  const cleaned = base32Str.toUpperCase().replace(/=/g, '');
  for (let i = 0; i < cleaned.length; i++) {
    const val = ALPHABET.indexOf(cleaned[i]);
    if (val !== -1) {
      bits += val.toString(2).padStart(5, '0');
    }
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function verifyTotpToken(token: string, secret: string, window = 1): boolean {
  if (!token || token.length !== 6) return false;
  try {
    const key = base32Decode(secret);
    const epoch = Math.floor(Date.now() / 1000);
    const currentStep = Math.floor(epoch / 30);

    for (let i = -window; i <= window; i++) {
      const step = currentStep + i;
      const buf = Buffer.alloc(8);
      buf.writeBigInt64BE(BigInt(step));
      const hmac = createHmac('sha1', key).update(buf).digest();
      const offset = hmac[hmac.length - 1] & 0xf;
      const code =
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff);
      const otp = (code % 1_000_000).toString().padStart(6, '0');
      if (otp === token) return true;
    }
  } catch {
    return false;
  }
  return false;
}

const TEMP_TOKEN_EXPIRY_MINUTES = 5;
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const BCRYPT_ROUNDS = 12;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

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

    const secret = generateTotpSecret();
    const issuer = 'AshaBuilders';
    const otpauthUrl = generateTotpURI({
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
    const isValid = verifyTotpToken(token, decrypted);
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

  /**
   * §3.1: validate a TOTP token for a user (used for password-change
   * re-challenge when 2FA is enabled).
   */
  async verifyTotp(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, totpEnabled: true, totpSecret: true },
    });
    if (!user || !user.totpEnabled || !user.totpSecret) {
      throw new UnauthorizedException('2FA is not enabled for this account');
    }
    const decrypted = this.decryptSecret(user.totpSecret);
    const isValid = verifyTotpToken(token, decrypted);
    if (!isValid) {
      throw new UnauthorizedException('Invalid verification code');
    }
    return { valid: true };
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

  private async revokeAllUserTokens(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async createRefreshToken(userId: string, companyId: string) {
    const rawToken = randomBytes(48).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await this.prisma.refreshToken.create({
      data: { token: tokenHash, userId, companyId, expiresAt },
    });
    return rawToken;
  }

  private async createTempToken(userId: string, companyId: string) {
    // Revoke any existing unused tokens for this user to prevent session fixation
    await this.prisma.tempToken.updateMany({
      where: { userId, usedAt: null, expiresAt: { gt: new Date() } },
      data: { expiresAt: new Date() },
    });
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + TEMP_TOKEN_EXPIRY_MINUTES);

    await this.prisma.tempToken.create({
      data: { token: tokenHash, userId, companyId, expiresAt },
    });
    return rawToken;
  }

  async generateChallenge(userId: string, companyId: string) {
    const tempToken = await this.createTempToken(userId, companyId);
    return { requiresTwoFactor: true, tempToken };
  }

  async authenticate(tempTokenStr: string, token: string) {
    const stored = await this.prisma.tempToken.findUnique({
      where: { token: hashToken(tempTokenStr) },
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
    const isValid = verifyTotpToken(token, decrypted);
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
            await this.revokeAllUserTokens(user.id);
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
            const refreshToken = await this.createRefreshToken(user.id, user.companyId);
            return {
              accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
              refreshToken,
              expiresIn: 900,
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
    await this.revokeAllUserTokens(user.id);

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
    const refreshToken = await this.createRefreshToken(user.id, user.companyId);

    return {
      accessToken,
      refreshToken,
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
