import { IsString, IsOptional, IsArray, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAnnouncementDto {
  @ApiProperty({ description: 'Announcement title' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Announcement body text' })
  @IsString()
  body!: string;

  @ApiPropertyOptional({
    description: 'Priority level',
    enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
  })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiProperty({ description: 'Target roles', type: [String] })
  @IsArray()
  @IsString({ each: true })
  targetRoles!: string[];

  @ApiProperty({ description: 'Target employee IDs', type: [String] })
  @IsArray()
  @IsString({ each: true })
  targetEmployees!: string[];

  @ApiPropertyOptional({ description: 'Expiration date' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class PublishAnnouncementDto {
  @ApiProperty({ description: 'Announcement ID' })
  @IsString()
  announcementId!: string;
}

export class ArchiveAnnouncementDto {
  @ApiProperty({ description: 'Announcement ID' })
  @IsString()
  announcementId!: string;
}
