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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const event_emitter_1 = require("@nestjs/event-emitter");
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../config/prisma.service");
const logger_service_1 = require("../../common/logger/logger.service");
const client_1 = require("@prisma/client");
const two_factor_service_1 = require("./two-factor.service");
const permissions_1 = require("../../common/auth/permissions");
const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
function hashToken(token) {
    return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
}
let AuthService = class AuthService {
    prisma;
    jwtService;
    eventEmitter;
    logger;
    twoFactorService;
    constructor(prisma, jwtService, eventEmitter, logger, twoFactorService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.eventEmitter = eventEmitter;
        this.logger = logger;
        this.twoFactorService = twoFactorService;
    }
    async getEffectivePermissions(userId, role) {
        const grants = await this.prisma.permissionGrant.findMany({
            where: { userId },
            select: { permission: true, granted: true },
        });
        return (0, permissions_1.mergePermissionsWithGrants)((0, permissions_1.getPermissionsForRole)(role), grants);
    }
    async precheck(email, password) {
        const user = await this.prisma.user.findFirst({
            where: { email, isActive: true },
        });
        if (!user || !user.hashedPassword) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        const valid = await bcrypt.compare(password, user.hashedPassword);
        if (!valid) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        if (user.totpEnabled) {
            return this.twoFactorService.generateChallenge(user.id, user.companyId);
        }
        return { requiresTwoFactor: false };
    }
    async login(email, password, ipAddress) {
        const user = await this.prisma.user.findFirst({
            where: { email, isActive: true },
        });
        if (!user || !user.hashedPassword) {
            this.eventEmitter.emit('security.login.failure', {
                email,
                reason: 'User not found or no password',
                ipAddress,
            });
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        const valid = await bcrypt.compare(password, user.hashedPassword);
        if (!valid) {
            this.eventEmitter.emit('security.login.failure', {
                email,
                reason: 'Invalid password',
                ipAddress,
            });
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        if (user.totpEnabled) {
            return this.twoFactorService.generateChallenge(user.id, user.companyId);
        }
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
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: ACCESS_TOKEN_EXPIRY,
        });
        const refreshToken = await this.createRefreshToken(user.id, user.companyId);
        this.eventEmitter.emit('security.login.success', {
            userId: user.id,
            companyId: user.companyId,
            email: user.email,
            ipAddress,
        });
        return {
            accessToken,
            refreshToken: refreshToken.token,
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
    async refresh(refreshTokenStr) {
        const tokenHash = hashToken(refreshTokenStr);
        const stored = await this.prisma.refreshToken.findUnique({
            where: { token: tokenHash },
            include: { users: { include: { employees: true } } },
        });
        if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
        if (!stored.users.isActive) {
            throw new common_1.UnauthorizedException('Account has been deactivated');
        }
        await this.prisma.refreshToken.update({
            where: { id: stored.id },
            data: { revokedAt: new Date() },
        });
        const employee = stored.users.employees;
        const payload = {
            sub: stored.users.id,
            email: stored.users.email,
            role: stored.users.role,
            companyId: stored.companyId,
            employeeId: employee?.id ?? null,
        };
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: ACCESS_TOKEN_EXPIRY,
        });
        const newRefreshToken = await this.createRefreshToken(stored.userId, stored.companyId);
        return {
            accessToken,
            refreshToken: newRefreshToken.token,
            expiresIn: 900,
        };
    }
    async revokeRefreshToken(token) {
        const tokenHash = hashToken(token);
        await this.prisma.refreshToken.updateMany({
            where: { token: tokenHash, revokedAt: null },
            data: { revokedAt: new Date() },
        });
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
        return { token: rawToken };
    }
    DESIGNATION_PREFIXES = {
        'Sales Manager': 'SM',
        'Sales Executive': 'SE',
        'HR Manager': 'HR',
        'Operations Manager': 'OM',
    };
    async generateEmployeeCode(designationId, companyId) {
        const designation = await this.prisma.designation.findUnique({
            where: { id: designationId },
        });
        const prefix = this.DESIGNATION_PREFIXES[designation?.name ?? ''] ?? 'EMP';
        const lastEmployee = await this.prisma.employee.findFirst({
            where: { companyId, employeeCode: { startsWith: `${prefix}-` } },
            orderBy: { createdAt: 'desc' },
            select: { employeeCode: true },
        });
        let nextNum = 1;
        if (lastEmployee?.employeeCode) {
            const match = lastEmployee.employeeCode.match(/(\d+)$/);
            if (match)
                nextNum = parseInt(match[1], 10) + 1;
        }
        return `${prefix}-${String(nextNum).padStart(3, '0')}`;
    }
    async createEmployeeWithUser(dto, companyId, requesterRole) {
        const department = await this.prisma.department.findFirst({
            where: { id: dto.departmentId, companyId },
        });
        if (!department) {
            throw new common_1.BadRequestException('Department not found in your company');
        }
        const designation = await this.prisma.designation.findFirst({
            where: { id: dto.designationId, companyId },
        });
        if (!designation) {
            throw new common_1.BadRequestException('Designation not found in your company');
        }
        const employeeCode = dto.employeeCode?.trim() ||
            (await this.generateEmployeeCode(dto.designationId, companyId));
        const existingEmployee = await this.prisma.employee.findFirst({
            where: { employeeCode, companyId },
        });
        if (existingEmployee) {
            throw new common_1.ConflictException(`Employee code "${employeeCode}" already exists`);
        }
        const existingUser = await this.prisma.user.findFirst({
            where: { email: dto.email, companyId },
        });
        if (existingUser) {
            throw new common_1.ConflictException(`User with email "${dto.email}" already exists`);
        }
        const targetRole = dto.role || client_1.UserRole.EMPLOYEE;
        if ((targetRole === client_1.UserRole.OWNER || targetRole === client_1.UserRole.ADMIN) &&
            requesterRole !== client_1.UserRole.OWNER) {
            throw new common_1.BadRequestException('Only OWNER can create OWNER or ADMIN accounts');
        }
        if (requesterRole !== client_1.UserRole.ADMIN && requesterRole !== client_1.UserRole.OWNER && targetRole !== client_1.UserRole.EMPLOYEE) {
            throw new common_1.BadRequestException('Only ADMIN and OWNER can create non-employee accounts');
        }
        const hashedPassword = dto.password
            ? await bcrypt.hash(dto.password, BCRYPT_ROUNDS)
            : null;
        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: dto.email,
                    companyId,
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                    hashedPassword,
                    role: targetRole,
                },
            });
            if (targetRole === client_1.UserRole.EMPLOYEE) {
                const employee = await tx.employee.create({
                    data: {
                        userId: user.id,
                        employeeCode,
                        companyId,
                        departmentId: dto.departmentId,
                        designationId: dto.designationId,
                        phone: dto.phone,
                        dateOfJoining: dto.dateOfJoining
                            ? new Date(dto.dateOfJoining)
                            : null,
                        salary: dto.salary ? new client_1.Prisma.Decimal(dto.salary) : null,
                        address: dto.address,
                        status: 'ACTIVE',
                    },
                    include: { users: true, departments: true, designations: true },
                });
                return { user, employee };
            }
            return { user, employee: null };
        });
    }
    async getEmployeeByUserId(userId) {
        return this.prisma.employee.findUnique({
            where: { userId },
            select: { id: true, employeeCode: true },
        });
    }
    async getFullUser(userId) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            select: { totpEnabled: true },
        });
    }
    async changePassword(userId, currentPassword, newPassword, opts) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                role: true,
                companyId: true,
                hashedPassword: true,
                totpEnabled: true,
            },
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        if (!user.hashedPassword) {
            throw new common_1.BadRequestException('No password set for this account');
        }
        const valid = await bcrypt.compare(currentPassword, user.hashedPassword);
        if (!valid) {
            this.eventEmitter.emit('security.password.change.failure', {
                userId,
                companyId: user.companyId,
                ipAddress: opts?.ipAddress,
                reason: 'Invalid current password',
            });
            throw new common_1.UnauthorizedException('Current password is incorrect');
        }
        const recent = await this.prisma.passwordHistory.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });
        for (const entry of recent) {
            if (await bcrypt.compare(newPassword, entry.hashedPassword)) {
                throw new common_1.BadRequestException('New password must differ from the last 5 passwords');
            }
        }
        if (user.totpEnabled) {
            if (!opts?.totpToken) {
                throw new common_1.UnauthorizedException('A TOTP verification code is required for this account');
            }
            await this.twoFactorService.verifyTotp(userId, opts.totpToken);
        }
        const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
        await this.prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: userId },
                data: { hashedPassword },
            });
            await tx.passwordHistory.create({
                data: {
                    userId,
                    companyId: user.companyId,
                    hashedPassword,
                },
            });
        });
        this.eventEmitter.emit('security.password.change', {
            userId,
            companyId: user.companyId,
        });
        await this.revokeAllUserTokens(userId);
        return { success: true, message: 'Password changed successfully. Please log in again.' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        event_emitter_1.EventEmitter2,
        logger_service_1.LoggerService,
        two_factor_service_1.TwoFactorService])
], AuthService);
//# sourceMappingURL=auth.service.js.map