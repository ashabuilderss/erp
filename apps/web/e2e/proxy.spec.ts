import { expect, test } from '@playwright/test';
import { signInAsAdmin } from './helpers';

test.beforeEach(async ({ page }) => {
  await signInAsAdmin(page);
});

test('preserves query parameters when forwarding API requests', async ({
  page,
}) => {
  const response = await page.request.get('/api/proxy/leads?limit=1&page=1');
  expect(response.ok()).toBeTruthy();

  const body = await response.json();
  expect(body.meta.limit).toBe(1);
});

test('preserves CSV download headers and body', async ({ page }) => {
  const response = await page.request.get(
    '/api/proxy/activity-logs/export?format=csv',
  );

  expect(response.ok()).toBeTruthy();
  expect(response.headers()['content-type']).toContain('text/csv');
  expect(response.headers()['content-disposition']).toContain(
    'activity-logs.csv',
  );
  expect(await response.text()).toContain('Time,Action,Entity');
});
