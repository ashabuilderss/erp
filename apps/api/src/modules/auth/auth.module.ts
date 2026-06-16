import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { EncryptionService } from '../../common/services/encryption.service';

function validateAuthSecret(): void {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'FATAL: AUTH_SECRET environment variable is required in production',
      );
    }
    Logger.warn(
      'AUTH_SECRET not set — using fallback. Set AUTH_SECRET in production.',
      'AuthModule',
    );
  }
}

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: () => {
        validateAuthSecret();
        return {
          secret: process.env.AUTH_SECRET || 'fallback-dev-only',
          signOptions: { expiresIn: '15m' },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, EncryptionService],
  exports: [JwtModule, AuthService, EncryptionService],
})
export class AuthModule implements OnModuleInit {
  onModuleInit() {
    validateAuthSecret();
  }
}
