import { expect, test } from '@playwright/test';

test('exposes an unauthenticated web health endpoint', async ({ request }) => {
  const response = await request.get('/api/health', { maxRedirects: 0 });

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: 'ok' });
});
