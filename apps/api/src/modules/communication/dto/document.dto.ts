import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDocumentDto {
  @ApiProperty({ description: 'Document name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'File type (e.g., pdf, docx)' })
  @IsString()
  fileType!: string;

  @ApiProperty({ description: 'File size in bytes' })
  @IsNumber()
  fileSize!: number;

  @ApiPropertyOptional({ description: 'Document category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: 'StorageObject ID' })
  @IsString()
  storageObjectId!: string;

  @ApiPropertyOptional({ description: 'Access level' })
  @IsOptional()
  @IsString()
  accessLevel?: string;
}

export class DeleteDocumentDto {
  @ApiProperty({ description: 'Document ID' })
  @IsString()
  documentId!: string;
}

export class LogDocumentAccessDto {
  @ApiProperty({ description: 'Document ID' })
  @IsString()
  documentId!: string;

  @ApiProperty({ description: 'Action type (e.g., VIEW, DOWNLOAD)' })
  @IsString()
  action!: string;
}
