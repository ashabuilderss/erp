import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyTwoFactorDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class DisableTwoFactorDto {
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class AuthenticateTwoFactorDto {
  @IsString()
  @IsNotEmpty()
  tempToken: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}
