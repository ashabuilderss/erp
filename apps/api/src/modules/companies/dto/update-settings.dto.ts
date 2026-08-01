import { IsOptional, IsBoolean, IsInt, Min, IsArray, IsString, Max } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsBoolean()
  debugLogging?: boolean;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(1440)
  sessionTimeoutMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(4)
  @Max(128)
  passwordMinLength?: number;

  @IsOptional()
  @IsBoolean()
  passwordRequireSpecialChar?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  maxLoginAttempts?: number;

  @IsOptional()
  @IsBoolean()
  encryptSensitiveFields?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedIpAddresses?: string[];

  @IsOptional()
  @IsBoolean()
  mfaRequired?: boolean;
}
