import { expect, test } from "@playwright/test";
import { signInAsAdmin, signInAsOwner, navigateTo } from "./helpers";

test.describe.serial("Reports & Analytics Page", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page);
  });

  test("Reports page loads with analytics cards", async ({ page }) => {
    await navigateTo(page, "/dashboard/reports");

    await expect(page.getByRole("heading", { name: "Active Employees" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("heading", { name: "Total Leads" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Properties" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Bookings" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Site Visits" })).toBeVisible();
  });

  test("Reports page shows conversion funnel section", async ({ page }) => {
    await navigateTo(page, "/dashboard/reports");

    await expect(page.getByText("Conversion Funnel")).toBeVisible({ timeout: 10000 });
  });

  test("Reports page shows report exports section", async ({ page }) => {
    await navigateTo(page, "/dashboard/reports");

    await expect(page.getByRole("heading", { name: "Export History" })).toBeVisible({ timeout: 10000 });
  });

  test("Reports page shows report catalog", async ({ page }) => {
    await navigateTo(page, "/dashboard/reports");

    await expect(page.getByRole("heading", { name: "Quick Export" })).toBeVisible({ timeout: 10000 });
  });

  test("Export buttons are present for each report type", async ({ page }) => {
    await navigateTo(page, "/dashboard/reports");

    const exportButtons = page.getByRole("button", { name: /export/i });
    await expect(exportButtons.first()).toBeVisible({ timeout: 15000 });
    const count = await exportButtons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

test.describe.serial("Reports Page — Owner Access", () => {
  test("Owner can view reports with analytics data", async ({ page }) => {
    await signInAsOwner(page);
    await navigateTo(page, "/dashboard/reports");

    await expect(page.getByRole("heading", { name: "Active Employees" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("heading", { name: "Total Leads" })).toBeVisible();
  });
});
