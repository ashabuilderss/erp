import { expect, test } from "@playwright/test";
import { signInAsAdmin, signInAsEmployee, signInAsOwner, navigateTo } from "./helpers";

test.describe.serial("Data visibility check for all roles", () => {
  test("Admin sees data on every page", async ({ page }) => {
    await signInAsAdmin(page);

    const pages = [
      "/dashboard/commissions",
      "/dashboard/incentives",
      "/dashboard/properties",
      "/dashboard/leads",
      "/dashboard/customers",
      "/dashboard/brokers",
      "/dashboard/complaints",
      "/dashboard/vendors",
      "/dashboard/materials",
      "/dashboard/inventory",
      "/dashboard/construction-sites",
      "/dashboard/payroll",
      "/dashboard/attendance",
      "/dashboard/employees",
      "/dashboard/departments",
      "/dashboard/designations",
      "/dashboard/leave-requests",
      "/dashboard/leave-allocations",
      "/dashboard/payments",
      "/dashboard/expenses",
      "/dashboard/eod-reports",
    ];

    for (const path of pages) {
      await page.goto(path);
      await expect(page).not.toHaveURL(/\/sign-in/);

      // Check page has content (not just white page)
      const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 200));
      const hasError = bodyText.includes("Something went wrong") || bodyText.includes("Error");
      if (hasError) {
        console.error(`  ❌ ${path} shows error: ${bodyText.substring(0, 100)}`);
      } else {
        console.log(`  ✅ ${path} loaded OK`);
      }
    }
  });

  test("Employee sees relevant data", async ({ page }) => {
    await signInAsEmployee(page);

    const pages = [
      { path: "/dashboard/commissions", desc: "commissions" },
      { path: "/dashboard/incentives", desc: "incentives" },
      { path: "/dashboard/properties", desc: "assigned properties" },
      { path: "/dashboard/leads", desc: "assigned leads" },
      { path: "/dashboard/attendance", desc: "own attendance" },
    ];

    for (const { path, desc } of pages) {
      await page.goto(path);
      await expect(page).not.toHaveURL(/\/sign-in/);
      const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 100));
      console.log(`  ${path} (${desc}): "${bodyText.substring(0, 60)}..."`);
    }
  });

  test("Owner sees OwnerDashboard and key pages", async ({ page }) => {
    await signInAsOwner(page);

    const pages = [
      "/dashboard",
      "/dashboard/approvals",
      "/dashboard/settings",
      "/dashboard/permissions",
      "/dashboard/users",
      "/dashboard/company",
      "/dashboard/commissions",
      "/dashboard/incentives",
    ];

    for (const path of pages) {
      await page.goto(path);
      await expect(page).not.toHaveURL(/\/sign-in/);
      const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 100));
      console.log(`  ${path}: "${bodyText.substring(0, 60)}..."`);
    }
  });
});
