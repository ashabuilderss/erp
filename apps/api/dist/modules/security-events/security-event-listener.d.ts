import { PrismaService } from '../../config/prisma.service';
export declare class SecurityEventListener {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    handleLoginSuccess(payload: {
        userId: string;
        companyId: string;
        email: string;
        ipAddress?: string;
    }): Promise<void>;
    handleLoginFailure(payload: {
        email: string;
        reason?: string;
        ipAddress?: string;
    }): Promise<void>;
    handlePasswordChange(payload: {
        userId: string;
        companyId: string;
    }): Promise<void>;
    handlePasswordChangeFailure(payload: {
        userId: string;
        companyId: string;
        ipAddress?: string;
        reason?: string;
    }): Promise<void>;
    handleUnauthorized(payload: {
        userId?: string;
        companyId: string;
        path: string;
        method: string;
    }): Promise<void>;
}
