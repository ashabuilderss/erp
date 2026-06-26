import { expect, test } from "@playwright/test";
import { signInAsAdmin, navigateTo } from "./helpers";

const adminRoutes = [
  { label: "Properties", path: "/dashboard/properties" },
  { label: "Leads", path: "/dashboard/leads" },
  { label: "Customers", path: "/dashboard/customers" },
  { label: "Employees", path: "/dashboard/employees" },
  { label: "Settings", path: "/dashboard/settings" },
];

test("admin can navigate the primary CRM and HRMS modules", async ({ page }) => {
  await signInAsAdmin(page);

  for (const route of adminRoutes) {
    await navigateTo(page, route.path);
    await expect(page).toHaveURL(new RegExp(`${route.path}$`));
  }
});
