import { TwoFactorService } from './two-factor.service';
import { VerifyTwoFactorDto, DisableTwoFactorDto, AuthenticateTwoFactorDto } from './dto/two-factor.dto';
interface RequestUser {
    id: string;
    companyId: string;
    email: string;
    role: string;
}
export declare class TwoFactorController {
    private readonly twoFactorService;
    constructor(twoFactorService: TwoFactorService);
    setup(user: RequestUser): Promise<{
        secret: string;
        qrCodeUrl: string;
        otpauthUrl: string;
    }>;
    verify(user: RequestUser, dto: VerifyTwoFactorDto): Promise<{
        backupCodes: string[];
    }>;
    disable(user: RequestUser, dto: DisableTwoFactorDto): Promise<{
        message: string;
    }>;
    backupCodes(user: RequestUser): Promise<{
        backupCodes: string[];
    }>;
    authenticate(dto: AuthenticateTwoFactorDto): Promise<{
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
export {};
