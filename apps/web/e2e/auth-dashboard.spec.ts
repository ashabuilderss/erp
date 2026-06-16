import { expect, test } from "@playwright/test";
import { adminEmail, adminPassword, signInAsAdmin } from "./helpers";

test("redirects unauthenticated dashboard requests to sign in", async ({ page }) => {
  await page.goto("/dashboard/properties");

  await expect(page).toHaveURL(/\/sign-in/);
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
});

test("rejects invalid credentials without leaving sign in", async ({ page }) => {
  await page.goto("/sign-in");

  await page.getByLabel("Email").fill(adminEmail);
  await page.getByLabel("Password").fill(`${adminPassword}-wrong`);
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page.getByText("Invalid email or password")).toBeVisible();
  await expect(page).toHaveURL(/\/sign-in/);
});

test("signs in and renders the admin dashboard", async ({ page }) => {
  await signInAsAdmin(page);

  await expect(page.getByText("Real-time overview of your business")).toBeVisible();
  await expect(page.getByText("Quick Actions")).toBeVisible();
  await expect(page.getByRole("link", { name: "Properties" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Employees" })).toBeVisible();
});
