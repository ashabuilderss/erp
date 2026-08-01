import { expect, test } from "@playwright/test";
import {
  signInAsAdmin,
  signInAsOwner,
  signInAsHR,
  signInAsEmployee,
  navigateTo,
} from "./helpers";

test.describe.serial("Dashboard KPI Cards", () => {
  test("Admin dashboard shows KPI cards", async ({ page }) => {
    await signInAsAdmin(page);

    const cards = [
      "Total Properties",
      "Total Leads",
      "Site Visits",
      "Total Bookings",
      "Total Employees",
      "Present Today",
    ];

    for (const label of cards) {
      await expect(page.getByText(label).first()).toBeVisible({ timeout: 10000 });
    }
  });

  test("Owner dashboard shows KPI cards", async ({ page }) => {
    await signInAsOwner(page);

    await expect(page.getByText("Properties").first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Total Leads").first()).toBeVisible();
  });

  test("HR dashboard loads successfully", async ({ page }) => {
    await signInAsHR(page);

    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toContain("/dashboard");
  });

  test("Employee dashboard loads successfully", async ({ page }) => {
    await signInAsEmployee(page);

    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toContain("/dashboard");
  });
});
