import { IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  currentPassword: string;

  @ApiProperty()
  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters' })
  newPassword: string;

  // §3.1: TOTP re-challenge required when the account has 2FA enabled
  // (Owner / Admin accounts are required to enroll 2FA).
  @ApiPropertyOptional({
    description: 'TOTP verification code required when 2FA is enabled.',
    example: '123456',
  })
  @IsOptional()
  @IsString()
  totpToken?: string;
}
