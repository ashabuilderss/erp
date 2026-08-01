import { IsString, IsOptional } from 'class-validator';

export class CreateAssignmentDto {
  @IsString()
  employeeId: string;

  @IsOptional()
  @IsString()
  condition?: string;
}

export class ReturnAssignmentDto {
  @IsOptional()
  @IsString()
  condition?: string;
}
