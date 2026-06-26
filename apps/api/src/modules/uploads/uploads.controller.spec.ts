import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { UploadsController } from './uploads.controller';

describe('UploadsController authorization', () => {
  it('restricts file deletion to owners and administrators', () => {
    const roles = Reflect.getMetadata(
      ROLES_KEY,
      UploadsController.prototype.deleteFile,
    );

    expect(roles).toEqual([UserRole.OWNER, UserRole.ADMIN]);
  });
});
