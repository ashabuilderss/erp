import { Module, OnModuleInit } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { EncryptionService } from '../../common/services/encryption.service';
import { TwoFactorService } from './two-factor.service';
import { TwoFactorController } from './two-factor.controller';

function validateAuthSecret(): void {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      'FATAL: AUTH_SECRET environment variable is required. Set AUTH_SECRET in your .env file.',
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
          secret: process.env.AUTH_SECRET,
          signOptions: { expiresIn: '15m' },
        };
      },
    }),
  ],
  controllers: [AuthController, TwoFactorController],
  providers: [AuthService, TwoFactorService, JwtStrategy, EncryptionService],
  exports: [JwtModule, AuthService, TwoFactorService, EncryptionService],
})
export class AuthModule implements OnModuleInit {
  onModuleInit() {
    validateAuthSecret();
  }
}
