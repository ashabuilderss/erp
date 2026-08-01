import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class SecurityEventListener {
  private readonly logger = new Logger(SecurityEventListener.name);

  constructor(private prisma: PrismaService) {}

  @OnEvent('security.login.success')
  async handleLoginSuccess(payload: {
    userId: string;
    companyId: string;
    email: string;
    ipAddress?: string;
  }) {
    try {
      await this.prisma.securityEvent.create({
        data: {
          companyId: payload.companyId,
          eventType: 'LOGIN_SUCCESS',
          severity: 'INFO',
          description: `Successful login for ${payload.email}`,
          userId: payload.userId,
          ipAddress: payload.ipAddress,
          metadata: { email: payload.email },
        },
      });
    } catch (err) {
      this.logger.error('Failed to log login success', err);
    }
  }

  @OnEvent('security.login.failure')
  async handleLoginFailure(payload: {
    email: string;
    reason?: string;
    ipAddress?: string;
  }) {
    try {
      const user = await this.prisma.user.findFirst({
        where: { email: payload.email },
        select: { id: true, companyId: true },
      });
      if (!user) return;

      await this.prisma.securityEvent.create({
        data: {
          companyId: user.companyId,
          eventType: 'LOGIN_FAILURE',
          severity: 'WARNING',
          description:
            payload.reason ?? `Failed login attempt for ${payload.email}`,
          userId: user.id,
          ipAddress: payload.ipAddress,
          metadata: { email: payload.email, reason: payload.reason },
        },
      });
    } catch (err) {
      this.logger.error('Failed to log login failure', err);
    }
  }

  @OnEvent('security.password.change')
  async handlePasswordChange(payload: { userId: string; companyId: string }) {
    try {
      await this.prisma.securityEvent.create({
        data: {
          companyId: payload.companyId,
          eventType: 'PASSWORD_CHANGE',
          severity: 'INFO',
          description: 'Password changed',
          userId: payload.userId,
          metadata: {},
        },
      });
    } catch (err) {
      this.logger.error('Failed to log password change', err);
    }
  }

  @OnEvent('security.password.change.failure')
  async handlePasswordChangeFailure(payload: {
    userId: string;
    companyId: string;
    ipAddress?: string;
    reason?: string;
  }) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
        select: { email: true },
      });
      await this.prisma.securityEvent.create({
        data: {
          companyId: payload.companyId,
          eventType: 'PASSWORD_CHANGE_FAILURE',
          severity: 'WARNING',
          description: `Failed password change attempt for ${user?.email ?? payload.userId}: ${payload.reason ?? 'unknown'}`,
          userId: payload.userId,
          ipAddress: payload.ipAddress,
          metadata: { reason: payload.reason },
        },
      });
    } catch (err) {
      this.logger.error('Failed to log password change failure', err);
    }
  }

  @OnEvent('security.unauthorized')
  async handleUnauthorized(payload: {
    userId?: string;
    companyId: string;
    path: string;
    method: string;
  }) {
    try {
      await this.prisma.securityEvent.create({
        data: {
          companyId: payload.companyId,
          eventType: 'UNAUTHORIZED_ACCESS',
          severity: 'WARNING',
          description: `Unauthorized ${payload.method} ${payload.path}`,
          userId: payload.userId,
          metadata: { path: payload.path, method: payload.method },
        },
      });
    } catch (err) {
      this.logger.error('Failed to log unauthorized access', err);
    }
  }
}
