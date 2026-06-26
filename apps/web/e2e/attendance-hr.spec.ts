import { expect, test } from "@playwright/test";
import { signInAsAdmin, signInAsHR, signInAsEmployee, navigateTo } from "./helpers";

test.describe.serial("Attendance Page — Admin View", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page);
  });

  test("Admin attendance page loads", async ({ page }) => {
    await navigateTo(page, "/dashboard/attendance");

    await expect(page.getByRole("heading", { name: "Attendance" })).toBeVisible({ timeout: 10000 });
  });

  test("Admin can see attendance records or empty state", async ({ page }) => {
    await navigateTo(page, "/dashboard/attendance");

    await page.waitForTimeout(2000);

    const hasTable = await page.getByRole("table").isVisible().catch(() => false);
    const hasEmpty = await page.getByText(/no attendance/i).isVisible().catch(() => false);
    const hasAddBtn = await page.getByRole("button", { name: /add/i }).isVisible().catch(() => false);

    expect(hasTable || hasEmpty || hasAddBtn).toBeTruthy();
  });
});

test.describe.serial("Attendance Page — HR View", () => {
  test("HR can access attendance page", async ({ page }) => {
    await signInAsHR(page);
    await navigateTo(page, "/dashboard/attendance");

    await expect(page.getByRole("heading", { name: "Attendance" })).toBeVisible({ timeout: 10000 });
  });
});

test.describe.serial("Attendance Page — Employee View", () => {
  test("Employee sees personal attendance view", async ({ page }) => {
    await signInAsEmployee(page);
    await navigateTo(page, "/dashboard/attendance");

    await page.waitForTimeout(2000);

    const hasCheckIn = await page.getByText(/check in/i).isVisible().catch(() => false);
    const hasAttendance = await page.getByRole("heading", { name: "Attendance" }).isVisible().catch(() => false);
    const hasMyAttendance = await page.getByText(/my attendance/i).isVisible().catch(() => false);

    expect(hasCheckIn || hasAttendance || hasMyAttendance).toBeTruthy();
  });
});
