"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TwoFactorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwoFactorService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../../config/prisma.service");
const encryption_service_1 = require("../../common/services/encryption.service");
const otplib = __importStar(require("otplib"));
const QRCode = __importStar(require("qrcode"));
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = require("crypto");
const client_1 = require("@prisma/client");
const TEMP_TOKEN_EXPIRY_MINUTES = 5;
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const BCRYPT_ROUNDS = 12;
function hashToken(token) {
    return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
}
let TwoFactorService = TwoFactorService_1 = class TwoFactorService {
    prisma;
    jwtService;
    encryptionService;
    logger = new common_1.Logger(TwoFactorService_1.name);
    constructor(prisma, jwtService, encryptionService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.encryptionService = encryptionService;
    }
    encryptSecret(plaintext) {
        return this.encryptionService.encrypt(plaintext);
    }
    decryptSecret(encrypted) {
        try {
            return this.encryptionService.decrypt(encrypted);
        }
        catch {
            return encrypted;
        }
    }
    isEncrypted(value) {
        return value.startsWith('enc:') || value.includes(':');
    }
    async setup(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        if (user.totpEnabled)
            throw new common_1.BadRequestException('2FA already enabled');
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
    async verify(userId, token) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.totpSecret)
            throw new common_1.BadRequestException('2FA not set up');
        if (user.totpEnabled)
            throw new common_1.BadRequestException('2FA already enabled');
        const decrypted = this.decryptSecret(user.totpSecret);
        const result = await otplib.verify({ token, secret: decrypted });
        if (!result.valid)
            throw new common_1.BadRequestException('Invalid verification code');
        const backupCodes = Array.from({ length: 8 }, () => (0, crypto_1.randomBytes)(4).toString('hex'));
        const hashedCodes = await Promise.all(backupCodes.map((c) => bcrypt.hash(c, BCRYPT_ROUNDS)));
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
    async verifyTotp(userId, token) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, totpEnabled: true, totpSecret: true },
        });
        if (!user || !user.totpEnabled || !user.totpSecret) {
            throw new common_1.UnauthorizedException('2FA is not enabled for this account');
        }
        const decrypted = this.decryptSecret(user.totpSecret);
        const result = await otplib.verify({ token, secret: decrypted });
        if (!result.valid) {
            throw new common_1.UnauthorizedException('Invalid verification code');
        }
        return { valid: true };
    }
    async disable(userId, password) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.hashedPassword)
            throw new common_1.BadRequestException('User not found');
        if (!user.totpEnabled)
            throw new common_1.BadRequestException('2FA not enabled');
        const valid = await bcrypt.compare(password, user.hashedPassword);
        if (!valid)
            throw new common_1.BadRequestException('Invalid password');
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                totpSecret: null,
                totpEnabled: false,
                totpVerifiedAt: null,
                backupCodes: client_1.Prisma.NullableJsonNullValueInput.DbNull,
            },
        });
        return { message: '2FA disabled' };
    }
    async generateBackupCodes(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.totpEnabled)
            throw new common_1.BadRequestException('2FA not enabled');
        const backupCodes = Array.from({ length: 8 }, () => (0, crypto_1.randomBytes)(4).toString('hex'));
        const hashedCodes = await Promise.all(backupCodes.map((c) => bcrypt.hash(c, BCRYPT_ROUNDS)));
        await this.prisma.user.update({
            where: { id: userId },
            data: { backupCodes: hashedCodes },
        });
        return { backupCodes };
    }
    async revokeAllUserTokens(userId) {
        await this.prisma.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }
    async createRefreshToken(userId, companyId) {
        const rawToken = (0, crypto_1.randomBytes)(48).toString('hex');
        const tokenHash = hashToken(rawToken);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
        await this.prisma.refreshToken.create({
            data: { token: tokenHash, userId, companyId, expiresAt },
        });
        return rawToken;
    }
    async createTempToken(userId, companyId) {
        await this.prisma.tempToken.updateMany({
            where: { userId, usedAt: null, expiresAt: { gt: new Date() } },
            data: { expiresAt: new Date() },
        });
        const rawToken = (0, crypto_1.randomBytes)(32).toString('hex');
        const tokenHash = hashToken(rawToken);
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + TEMP_TOKEN_EXPIRY_MINUTES);
        await this.prisma.tempToken.create({
            data: { token: tokenHash, userId, companyId, expiresAt },
        });
        return rawToken;
    }
    async generateChallenge(userId, companyId) {
        const tempToken = await this.createTempToken(userId, companyId);
        return { requiresTwoFactor: true, tempToken };
    }
    async authenticate(tempTokenStr, token) {
        const stored = await this.prisma.tempToken.findUnique({
            where: { token: hashToken(tempTokenStr) },
        });
        if (!stored || stored.usedAt || stored.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Invalid or expired temporary token');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: stored.userId },
        });
        if (!user || !user.totpEnabled || !user.totpSecret) {
            throw new common_1.UnauthorizedException('2FA not enabled');
        }
        const decrypted = this.decryptSecret(user.totpSecret);
        const result = await otplib.verify({ token, secret: decrypted });
        if (!result.valid) {
            if (user.backupCodes) {
                const codes = user.backupCodes;
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
            throw new common_1.UnauthorizedException('Invalid verification code');
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
};
exports.TwoFactorService = TwoFactorService;
exports.TwoFactorService = TwoFactorService = TwoFactorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        encryption_service_1.EncryptionService])
], TwoFactorService);
//# sourceMappingURL=two-factor.service.js.map