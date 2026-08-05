import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../config/prisma.service';
import { EncryptionService } from '../../common/services/encryption.service';
export declare class TwoFactorService {
    private prisma;
    private jwtService;
    private encryptionService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService, encryptionService: EncryptionService);
    private encryptSecret;
    private decryptSecret;
    private isEncrypted;
    setup(userId: string): Promise<{
        secret: string;
        qrCodeUrl: string;
        otpauthUrl: string;
    }>;
    verify(userId: string, token: string): Promise<{
        backupCodes: string[];
    }>;
    verifyTotp(userId: string, token: string): Promise<{
        valid: boolean;
    }>;
    disable(userId: string, password: string): Promise<{
        message: string;
    }>;
    generateBackupCodes(userId: string): Promise<{
        backupCodes: string[];
    }>;
    private revokeAllUserTokens;
    private createRefreshToken;
    private createTempToken;
    generateChallenge(userId: string, companyId: string): Promise<{
        requiresTwoFactor: boolean;
        tempToken: string;
    }>;
    authenticate(tempTokenStr: string, token: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        backupCodeUsed: boolean;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
            companyId: string;
            employeeId: string | null;
        };
    } | {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
            companyId: string;
            employeeId: string | null;
        };
        backupCodeUsed?: undefined;
    }>;
}
