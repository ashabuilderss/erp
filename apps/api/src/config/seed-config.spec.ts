import {
  assertProductionSeedCompanyIsEmpty,
  getSeedConfig,
} from '../../prisma/seed-config';

describe('getSeedConfig', () => {
  it('returns local defaults with 12 bcrypt rounds outside production', () => {
    expect(getSeedConfig({})).toEqual({
      companyName: 'Default Company',
      companySlug: 'default-company',
      adminEmail: 'admin@company.com',
      adminPassword: 'Admin@123',
      bcryptRounds: 12,
    });
  });

  it('requires explicit seed values in production', () => {
    expect(() => getSeedConfig({ NODE_ENV: 'production' })).toThrow(
      'Production seed requires explicit values: SEED_COMPANY_NAME, SEED_COMPANY_SLUG, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD',
    );
  });

  it('treats whitespace-only production seed values as missing', () => {
    expect(() =>
      getSeedConfig({
        NODE_ENV: 'production',
        SEED_COMPANY_NAME: ' ',
        SEED_COMPANY_SLUG: '\t',
        SEED_ADMIN_EMAIL: '',
        SEED_ADMIN_PASSWORD: '\n',
      }),
    ).toThrow(
      'Production seed requires explicit values: SEED_COMPANY_NAME, SEED_COMPANY_SLUG, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD',
    );
  });

  it('rejects the local default password in production', () => {
    expect(() =>
      getSeedConfig({
        NODE_ENV: 'production',
        SEED_COMPANY_NAME: 'Acme Realty',
        SEED_COMPANY_SLUG: 'acme-realty',
        SEED_ADMIN_EMAIL: 'owner@acme.example',
        SEED_ADMIN_PASSWORD: 'Admin@123',
      }),
    ).toThrow(
      'Production seed password must not use the local default password',
    );
  });

  it('rejects template placeholder values in production', () => {
    expect(() =>
      getSeedConfig({
        NODE_ENV: 'production',
        SEED_COMPANY_NAME: 'Owner Company',
        SEED_COMPANY_SLUG: 'owner-company',
        SEED_ADMIN_EMAIL: 'owner-admin@example.com',
        SEED_ADMIN_PASSWORD:
          'replace-with-temporary-password-and-rotate-after-login',
      }),
    ).toThrow(
      'Production seed values must replace template placeholders: SEED_COMPANY_NAME, SEED_COMPANY_SLUG, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD',
    );
  });

  it('returns explicit safe seed values in production', () => {
    expect(
      getSeedConfig({
        NODE_ENV: 'production',
        SEED_COMPANY_NAME: 'Acme Realty',
        SEED_COMPANY_SLUG: 'acme-realty',
        SEED_ADMIN_EMAIL: 'owner@acme.example',
        SEED_ADMIN_PASSWORD: 'Use-A-Real-Temporary-Password-123!',
      }),
    ).toEqual({
      companyName: 'Acme Realty',
      companySlug: 'acme-realty',
      adminEmail: 'owner@acme.example',
      adminPassword: 'Use-A-Real-Temporary-Password-123!',
      bcryptRounds: 12,
    });
  });
});

describe('assertProductionSeedCompanyIsEmpty', () => {
  it('allows local seed reruns for an existing company', () => {
    expect(() =>
      assertProductionSeedCompanyIsEmpty(
        {},
        {
          userCount: 1,
          employeeCount: 1,
        },
      ),
    ).not.toThrow();
  });

  it('allows production seeding for an empty company', () => {
    expect(() =>
      assertProductionSeedCompanyIsEmpty(
        { NODE_ENV: 'production' },
        {
          userCount: 0,
          employeeCount: 0,
        },
      ),
    ).not.toThrow();
  });

  it('refuses production seeding for an existing company with users', () => {
    expect(() =>
      assertProductionSeedCompanyIsEmpty(
        { NODE_ENV: 'production' },
        {
          userCount: 1,
          employeeCount: 0,
        },
      ),
    ).toThrow(
      'Production seed refuses to reset an existing company. Seed only an empty production company.',
    );
  });

  it('refuses production seeding for an existing company with employees', () => {
    expect(() =>
      assertProductionSeedCompanyIsEmpty(
        { NODE_ENV: 'production' },
        {
          userCount: 0,
          employeeCount: 1,
        },
      ),
    ).toThrow(
      'Production seed refuses to reset an existing company. Seed only an empty production company.',
    );
  });
});
