import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdatePermissionGrantsDto } from './update-permission-grants.dto';

describe('UpdatePermissionGrantsDto', () => {
  it('accepts a known permission with a boolean grant value', async () => {
    const dto = plainToInstance(UpdatePermissionGrantsDto, {
      grants: [{ permission: 'lead:read', granted: true }],
    });
    expect(await validate(dto)).toEqual([]);
  });

  it('rejects unknown permission names and non-boolean grant values', async () => {
    const dto = plainToInstance(UpdatePermissionGrantsDto, {
      grants: [{ permission: 'company:takeover', granted: 'yes' }],
    });
    expect(await validate(dto)).not.toHaveLength(0);
  });
});
