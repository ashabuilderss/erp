import { IsOptional, IsString, IsNumber, IsBoolean, IsEnum, Matches, Min, Max, IsNotEmpty } from 'class-validator';
import { PunchType } from '@prisma/client';

export class CheckInDto {
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsString()
  @Matches(/^(https?:\/\/|\/)/, { message: 'checkInPhoto must be a valid URL or path' })
  checkInPhoto?: string;

  @IsString()
  @IsNotEmpty({ message: 'nonce is required for attendance punch' })
  nonce: string;
}

export class CheckOutDto {
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsString()
  @Matches(/^(https?:\/\/|\/)/, { message: 'checkOutPhoto must be a valid URL or path' })
  checkOutPhoto?: string;

  @IsString()
  @IsNotEmpty({ message: 'nonce is required for attendance punch' })
  nonce: string;
}

export class PunchDto {
  @IsEnum(PunchType)
  punchType: PunchType;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsString()
  @Matches(/^(https?:\/\/|\/)/, { message: 'photoUrl must be a valid URL or path' })
  photoUrl?: string;

  @IsString()
  @IsNotEmpty({ message: 'nonce is required for attendance punch' })
  nonce: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsNumber()
  gpsAccuracy?: number;

  @IsOptional()
  @IsBoolean()
  mockLocationDetected?: boolean;

  @IsOptional()
  @IsBoolean()
  developerModeActive?: boolean;
}
