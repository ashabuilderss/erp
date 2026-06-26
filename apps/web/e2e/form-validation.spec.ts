import { expect, test } from '@playwright/test';
import { signInAsOwner } from './helpers';

test.beforeEach(async ({ page }) => {
  await signInAsOwner(page);
});

test('site visit form requires customer and assignee but not an optional lead', async ({
  page,
}) => {
  await page.goto('/dashboard/site-visits');
  await page.getByRole('button', { name: 'Add Site Visit' }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();

  await expect(page.getByText('Property is required')).toBeVisible();
  await expect(page.getByText('Customer is required')).toBeVisible();
  await expect(page.getByText('Assigned employee is required')).toBeVisible();
  await expect(page.getByText('Date is required')).toBeVisible();
  await expect(page.getByText('Lead is required')).toHaveCount(0);
});

test('designation form validates the department before submission', async ({
  page,
}) => {
  await page.goto('/dashboard/designations');
  await page.getByRole('button', { name: 'Add Designation' }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();

  await expect(page.getByText('Name is required')).toBeVisible();
  await expect(page.getByText('Department is required')).toBeVisible();
});
