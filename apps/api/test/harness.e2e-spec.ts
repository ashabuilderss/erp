import { authHeader } from './helpers/auth';
import { createE2eApp } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';

describe('e2e test harness', () => {
  it('loads helper modules and creates auth headers', () => {
    expect(typeof createE2eApp).toBe('function');
    expect(typeof createCompanyFixture).toBe('function');
    expect(typeof resetDatabase).toBe('function');
    expect(authHeader('token')).toEqual({ Authorization: 'Bearer token' });
  });
});
