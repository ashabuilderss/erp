import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDesignationDto {
  @ApiProperty({ example: 'Sales Manager' })
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  departmentId: string;

  @ApiPropertyOptional({ example: 'Manages sales team' })
  @IsOptional()
  @IsString()
  description?: string;
}
