import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDeviceRegistrationDto {
  @ApiProperty()
  @IsString()
  deviceName: string;

  @ApiProperty()
  @IsString()
  deviceId: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isTrusted?: boolean;
}
