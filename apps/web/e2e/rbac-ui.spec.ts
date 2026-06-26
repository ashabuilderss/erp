import { expect, test } from '@playwright/test';
import { signInAsEmployee } from './helpers';

test('employee property view does not expose property mutation controls', async ({ page }) => {
  await signInAsEmployee(page);
  await page.goto('/dashboard/properties');
  await expect(page.getByRole('button', { name: 'Add Property' })).toHaveCount(0);
  await expect(page.locator('[data-testid="property-edit-action"]')).toHaveCount(0);
  await expect(page.locator('[data-testid="property-delete-action"]')).toHaveCount(0);
});
