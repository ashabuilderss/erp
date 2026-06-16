import { expect, type Page } from "@playwright/test";

export const adminEmail = process.env.WEB_E2E_ADMIN_EMAIL ?? "admin@company.com";
export const adminPassword = process.env.WEB_E2E_ADMIN_PASSWORD ?? "Admin@123";

export async function signInAsAdmin(page: Page) {
  await page.goto("/sign-in");
  await expect(page.getByText("RealEstate CRM")).toBeVisible();

  await page.getByLabel("Email").fill(adminEmail);
  await page.getByLabel("Password").fill(adminPassword);

  await Promise.all([
    page.waitForURL(/\/dashboard(?:$|\?)/),
    page.getByRole("button", { name: /sign in/i }).click(),
  ]);

  await expect(page.getByRole("heading", { name: "Admin Dashboard" }).first()).toBeVisible();
}
