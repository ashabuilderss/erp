import { IsArray, IsBoolean, IsIn, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Permissions } from '../../../common/auth/permissions';

class PermissionGrantEntry {
  @IsString()
  @IsIn(Object.values(Permissions))
  permission: string;

  @IsBoolean()
  granted: boolean;
}

export class UpdatePermissionGrantsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionGrantEntry)
  grants: PermissionGrantEntry[];
}
