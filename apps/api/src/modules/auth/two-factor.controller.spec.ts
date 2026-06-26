import { PUBLIC_KEY } from '../../common/decorators/roles.decorator';
import { TwoFactorController } from './two-factor.controller';

describe('TwoFactorController', () => {
  it('marks authenticate as public', () => {
    const isPublic = Reflect.getMetadata(
      PUBLIC_KEY,
      TwoFactorController.prototype.authenticate,
    );

    expect(isPublic).toBe(true);
  });
});
