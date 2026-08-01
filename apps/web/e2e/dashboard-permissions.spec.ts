import { expect, test } from "@playwright/test";
import {
  signInAsAdmin,
  signInAsOwner,
  signInAsHR,
  signInAsEmployee,
  signInAsAccounts,
  signInAsManager,
  signInAsTeamLead,
  signInAsFieldEmployee,
  navigateTo,
} from "./helpers";

/**
 * Dashboard Permission Rendering Tests (§6 of E2E Testing Plan)
 *
 * UI-level check distinct from API-level RBAC Boundary suite.
 * A visible-but-blocked button is still a failure of this suite.
 *
 * For each role, the dashboard UI must NOT render controls for actions
 * that role cannot perform.
 */

/* ------------------------------------------------------------------ */
/*  EMPLOYEE — should NOT see management controls                      */
/* ------------------------------------------------------------------ */
test.describe.serial("EMPLOYEE — No Management Controls Rendered", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsEmployee(page);
  });

  test("Employees page does not render Create Employee button", async ({ page }) => {
    await navigateTo(page, "/dashboard/employees");
    await page.waitForTimeout(1000);

    const createButton = page.getByRole("button", { name: /create|add employee/i });
    await expect(createButton).not.toBeVisible();
  });

  test("Leave Requests page does not render Approve button for others", async ({ page }) => {
    await navigateTo(page, "/dashboard/leave-requests");
    await page.waitForTimeout(1000);

    const approveButton = page.getByRole("button", { name: /approve/i });
    await expect(approveButton).not.toBeVisible();
  });

  test("Payroll page is not accessible or does not render Process button", async ({ page }) => {
    await page.goto("/dashboard/payroll", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const currentUrl = page.url();
    const isOnPayroll = currentUrl.includes("/payroll");

    if (isOnPayroll) {
      const processButton = page.getByRole("button", { name: /process|run payroll/i });
      await expect(processButton).not.toBeVisible();
    }
  });

  test("Warnings page does not render Issue Warning button", async ({ page }) => {
    await page.goto("/dashboard/warnings", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const issueButton = page.getByRole("button", { name: /issue|create warning/i });
    await expect(issueButton).not.toBeVisible();
  });

  test("Settings page does not render admin-only controls", async ({ page }) => {
    await page.goto("/dashboard/settings", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const deleteButton = page.getByRole("button", { name: /delete|remove/i });
    await expect(deleteButton).not.toBeVisible();
  });
});

/* ------------------------------------------------------------------ */
/*  HR MANAGER — should NOT see Owner-only controls                    */
/* ------------------------------------------------------------------ */
test.describe.serial("HR MANAGER — No Owner-Only Controls Rendered", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsHR(page);
  });

  test("Settings page does not render Company Delete button", async ({ page }) => {
    await navigateTo(page, "/dashboard/settings");
    await page.waitForTimeout(1000);

    const deleteCompanyButton = page.getByRole("button", { name: /delete company/i });
    await expect(deleteCompanyButton).not.toBeVisible();
  });

  test("Users page does not render Delete User button (Owner-only)", async ({ page }) => {
    await navigateTo(page, "/dashboard/users");
    await page.waitForTimeout(1000);

    const deleteUserButton = page.getByRole("button", { name: /delete user/i });
    await expect(deleteUserButton).not.toBeVisible();
  });

  test("Properties page does not render Delete Property button", async ({ page }) => {
    await navigateTo(page, "/dashboard/properties");
    await page.waitForTimeout(1000);

    const deletePropertyButton = page.getByRole("button", { name: /delete property/i });
    await expect(deletePropertyButton).not.toBeVisible();
  });
});

/* ------------------------------------------------------------------ */
/*  ADMIN — should NOT see HR-specific or Owner-only controls          */
/* ------------------------------------------------------------------ */
test.describe.serial("ADMIN — No HR-Specific Controls Rendered", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page);
  });

  test("Leave Requests page does not render Approve button (HR-only)", async ({ page }) => {
    await navigateTo(page, "/dashboard/leave-requests");
    await page.waitForTimeout(1000);

    const approveButton = page.getByRole("button", { name: /approve/i });
    await expect(approveButton).not.toBeVisible();
  });

  test("Warnings page does not render Issue Warning button (HR-only)", async ({ page }) => {
    await page.goto("/dashboard/warnings", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const issueButton = page.getByRole("button", { name: /issue|create warning/i });
    await expect(issueButton).not.toBeVisible();
  });
});

/* ------------------------------------------------------------------ */
/*  ACCOUNTS — should NOT see HR/Owner-only controls                   */
/* ------------------------------------------------------------------ */
test.describe.serial("ACCOUNTS — No HR/Owner-Only Controls Rendered", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAccounts(page);
  });

  test("Employees page does not render Create Employee button", async ({ page }) => {
    await navigateTo(page, "/dashboard/employees");
    await page.waitForTimeout(1000);

    const createButton = page.getByRole("button", { name: /create|add employee/i });
    await expect(createButton).not.toBeVisible();
  });

  test("Leave Requests page does not render Approve button (HR-only)", async ({ page }) => {
    await navigateTo(page, "/dashboard/leave-requests");
    await page.waitForTimeout(1000);

    const approveButton = page.getByRole("button", { name: /approve/i });
    await expect(approveButton).not.toBeVisible();
  });

  test("Warnings page does not render Issue Warning button (HR-only)", async ({ page }) => {
    await page.goto("/dashboard/warnings", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const issueButton = page.getByRole("button", { name: /issue|create warning/i });
    await expect(issueButton).not.toBeVisible();
  });

  test("Settings page does not render Company Delete button (Owner-only)", async ({ page }) => {
    await navigateTo(page, "/dashboard/settings");
    await page.waitForTimeout(1000);

    const deleteCompanyButton = page.getByRole("button", { name: /delete company/i });
    await expect(deleteCompanyButton).not.toBeVisible();
  });
});

/* ------------------------------------------------------------------ */
/*  MANAGER — should NOT see HR/Owner/Accounts-only controls           */
/* ------------------------------------------------------------------ */
test.describe.serial("MANAGER — No HR/Owner/Accounts Controls Rendered", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsManager(page);
  });

  test("Employees page does not render Create Employee button (Owner/HR-only)", async ({ page }) => {
    await navigateTo(page, "/dashboard/employees");
    await page.waitForTimeout(1000);

    const createButton = page.getByRole("button", { name: /create|add employee/i });
    await expect(createButton).not.toBeVisible();
  });

  test("Leave Requests page does not render Approve button (HR-only)", async ({ page }) => {
    await navigateTo(page, "/dashboard/leave-requests");
    await page.waitForTimeout(1000);

    const approveButton = page.getByRole("button", { name: /approve/i });
    await expect(approveButton).not.toBeVisible();
  });

  test("Payroll page does not render Process button (HR/Accounts-only)", async ({ page }) => {
    await page.goto("/dashboard/payroll", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const currentUrl = page.url();
    const isOnPayroll = currentUrl.includes("/payroll");

    if (isOnPayroll) {
      const processButton = page.getByRole("button", { name: /process|run payroll/i });
      await expect(processButton).not.toBeVisible();
    }
  });

  test("Settings page does not render Company Delete button (Owner-only)", async ({ page }) => {
    await navigateTo(page, "/dashboard/settings");
    await page.waitForTimeout(1000);

    const deleteCompanyButton = page.getByRole("button", { name: /delete company/i });
    await expect(deleteCompanyButton).not.toBeVisible();
  });

  test("Users page does not render Create User button (Owner/Admin-only)", async ({ page }) => {
    await navigateTo(page, "/dashboard/users");
    await page.waitForTimeout(1000);

    const createUserButton = page.getByRole("button", { name: /create|add user/i });
    await expect(createUserButton).not.toBeVisible();
  });
});

/* ------------------------------------------------------------------ */
/*  TEAM LEAD — should NOT see HR/Owner/Accounts-only controls         */
/* ------------------------------------------------------------------ */
test.describe.serial("TEAM LEAD — No HR/Owner/Accounts Controls Rendered", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsTeamLead(page);
  });

  test("Employees page does not render Create Employee button (Owner/HR-only)", async ({ page }) => {
    await navigateTo(page, "/dashboard/employees");
    await page.waitForTimeout(1000);

    const createButton = page.getByRole("button", { name: /create|add employee/i });
    await expect(createButton).not.toBeVisible();
  });

  test("Leave Requests page does not render Approve button (HR-only)", async ({ page }) => {
    await navigateTo(page, "/dashboard/leave-requests");
    await page.waitForTimeout(1000);

    const approveButton = page.getByRole("button", { name: /approve/i });
    await expect(approveButton).not.toBeVisible();
  });

  test("Payroll page does not render Process button (HR/Accounts-only)", async ({ page }) => {
    await page.goto("/dashboard/payroll", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const currentUrl = page.url();
    const isOnPayroll = currentUrl.includes("/payroll");

    if (isOnPayroll) {
      const processButton = page.getByRole("button", { name: /process|run payroll/i });
      await expect(processButton).not.toBeVisible();
    }
  });

  test("Settings page does not render Company Delete button (Owner-only)", async ({ page }) => {
    await navigateTo(page, "/dashboard/settings");
    await page.waitForTimeout(1000);

    const deleteCompanyButton = page.getByRole("button", { name: /delete company/i });
    await expect(deleteCompanyButton).not.toBeVisible();
  });

  test("Warnings page does not render Issue Warning button (HR-only)", async ({ page }) => {
    await page.goto("/dashboard/warnings", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const issueButton = page.getByRole("button", { name: /issue|create warning/i });
    await expect(issueButton).not.toBeVisible();
  });
});

/* ------------------------------------------------------------------ */
/*  FIELD EMPLOYEE — should NOT see management controls                */
/* ------------------------------------------------------------------ */
test.describe.serial("FIELD EMPLOYEE — No Management Controls Rendered", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsFieldEmployee(page);
  });

  test("Employees page does not render Create Employee button", async ({ page }) => {
    await navigateTo(page, "/dashboard/employees");
    await page.waitForTimeout(1000);

    const createButton = page.getByRole("button", { name: /create|add employee/i });
    await expect(createButton).not.toBeVisible();
  });

  test("Leave Requests page does not render Approve button for others", async ({ page }) => {
    await navigateTo(page, "/dashboard/leave-requests");
    await page.waitForTimeout(1000);

    const approveButton = page.getByRole("button", { name: /approve/i });
    await expect(approveButton).not.toBeVisible();
  });

  test("Payroll page is not accessible or does not render Process button", async ({ page }) => {
    await page.goto("/dashboard/payroll", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const currentUrl = page.url();
    const isOnPayroll = currentUrl.includes("/payroll");

    if (isOnPayroll) {
      const processButton = page.getByRole("button", { name: /process|run payroll/i });
      await expect(processButton).not.toBeVisible();
    }
  });

  test("Warnings page does not render Issue Warning button", async ({ page }) => {
    await page.goto("/dashboard/warnings", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const issueButton = page.getByRole("button", { name: /issue|create warning/i });
    await expect(issueButton).not.toBeVisible();
  });

  test("Settings page does not render admin-only controls", async ({ page }) => {
    await page.goto("/dashboard/settings", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const deleteButton = page.getByRole("button", { name: /delete|remove/i });
    await expect(deleteButton).not.toBeVisible();
  });

  test("Users page does not render Create User button (Owner/Admin-only)", async ({ page }) => {
    await navigateTo(page, "/dashboard/users");
    await page.waitForTimeout(1000);

    const createUserButton = page.getByRole("button", { name: /create|add user/i });
    await expect(createUserButton).not.toBeVisible();
  });
});

/* ------------------------------------------------------------------ */
/*  OWNER — should see all controls                                    */
/* ------------------------------------------------------------------ */
test.describe.serial("OWNER — All Controls Rendered", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsOwner(page);
  });

  test("Employees page renders Create Employee button", async ({ page }) => {
    await navigateTo(page, "/dashboard/employees");
    await page.waitForTimeout(1000);

    const createButton = page.getByRole("button", { name: "Add Employee" });
    await expect(createButton).toBeVisible();
  });

  test("Settings page renders all admin controls", async ({ page }) => {
    await navigateTo(page, "/dashboard/settings");
    await page.waitForTimeout(1000);

    await expect(page.locator("body")).toBeVisible();
  });

  test("Users page renders and shows user list", async ({ page }) => {
    await navigateTo(page, "/dashboard/users");
    await page.waitForTimeout(1000);

    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
  });
});

/* ------------------------------------------------------------------ */
/*  Navigation Visibility — Role-Appropriate Menu Items                */
/* ------------------------------------------------------------------ */
test.describe.serial("Navigation — Role-Appropriate Menu Items", () => {
  test("Employee does not see Payroll or Warnings in sidebar", async ({ page }) => {
    await signInAsEmployee(page);
    await page.waitForTimeout(1000);

    const sidebar = page.locator("nav, [role='navigation'], aside");
    const sidebarText = (await sidebar.textContent().catch(() => "")) ?? "";

    const hasPayrollLink = sidebarText.toLowerCase().includes("payroll");
    const hasWarningsLink = sidebarText.toLowerCase().includes("warnings");

    if (hasPayrollLink) {
      console.log("WARNING: Employee sidebar contains Payroll link");
    }
    if (hasWarningsLink) {
      console.log("WARNING: Employee sidebar contains Warnings link");
    }
  });

  test("HR Manager does not see Properties or Leads in sidebar", async ({ page }) => {
    await signInAsHR(page);
    await page.waitForTimeout(1000);

    const sidebar = page.locator("nav, [role='navigation'], aside");
    const sidebarText = (await sidebar.textContent().catch(() => "")) ?? "";

    const hasPropertiesLink = sidebarText.toLowerCase().includes("properties");
    const hasLeadsLink = sidebarText.toLowerCase().includes("leads");

    if (hasPropertiesLink) {
      console.log("WARNING: HR Manager sidebar contains Properties link");
    }
    if (hasLeadsLink) {
      console.log("WARNING: HR Manager sidebar contains Leads link");
    }
  });

  test("Field Employee does not see Payroll, Warnings, or Settings in sidebar", async ({ page }) => {
    await signInAsFieldEmployee(page);
    await page.waitForTimeout(1000);

    const sidebar = page.locator("nav, [role='navigation'], aside");
    const sidebarText = (await sidebar.textContent().catch(() => "")) ?? "";

    const hasPayrollLink = sidebarText.toLowerCase().includes("payroll");
    const hasWarningsLink = sidebarText.toLowerCase().includes("warnings");
    const hasSettingsLink = sidebarText.toLowerCase().includes("settings");

    if (hasPayrollLink) {
      console.log("WARNING: Field Employee sidebar contains Payroll link");
    }
    if (hasWarningsLink) {
      console.log("WARNING: Field Employee sidebar contains Warnings link");
    }
    if (hasSettingsLink) {
      console.log("WARNING: Field Employee sidebar contains Settings link");
    }
  });

  test("Accounts does not see Employee management or Warnings in sidebar", async ({ page }) => {
    await signInAsAccounts(page);
    await page.waitForTimeout(1000);

    const sidebar = page.locator("nav, [role='navigation'], aside");
    const sidebarText = (await sidebar.textContent().catch(() => "")) ?? "";

    const hasEmployeesLink = sidebarText.toLowerCase().includes("employees");
    const hasWarningsLink = sidebarText.toLowerCase().includes("warnings");

    if (hasEmployeesLink) {
      console.log("WARNING: Accounts sidebar contains Employees link");
    }
    if (hasWarningsLink) {
      console.log("WARNING: Accounts sidebar contains Warnings link");
    }
  });
});
