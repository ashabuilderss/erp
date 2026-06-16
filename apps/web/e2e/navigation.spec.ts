import { expect, test } from "@playwright/test";
import { signInAsAdmin } from "./helpers";

const adminRoutes = [
  { label: "Properties", path: "/dashboard/properties", heading: "Properties" },
  { label: "Leads", path: "/dashboard/leads", heading: "Leads" },
  { label: "Customers", path: "/dashboard/customers", heading: "Customers" },
  { label: "Employees", path: "/dashboard/employees", heading: "Employees" },
  { label: "Reports", path: "/dashboard/reports", heading: "Reports" },
  { label: "Settings", path: "/dashboard/settings", heading: "Settings" },
];

test("admin can navigate the primary CRM and HRMS modules", async ({ page }) => {
  await signInAsAdmin(page);

  for (const route of adminRoutes) {
    await page.goto(route.path);
    await expect(page).toHaveURL(new RegExp(`${route.path}$`));
    await expect(page.getByRole("heading", { name: route.heading }).first()).toBeVisible();
  }
});
