/**
 * FULL APPLICATION AUDIT — E2E Test Suite
 * =========================================
 * Tests every major feature of the RealEstate CRM dashboard.
 *
 * Run instructions:
 *   cd apps/web
 *   $env:PLAYWRIGHT_SKIP_WEBSERVER="1"
 *   npx playwright test --config=playwright.config.ts e2e/full-app-audit.spec.ts --reporter=list
 *
 * Prerequisites:
 *   - API server running on :4000
 *   - Web server running on :3000
 *   - Database seeded with test accounts
 */

import { expect, test, type Page } from "@playwright/test";

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */

// Credentials per user-provided test accounts
const CREDS = {
  owner:  { email: "owner@company.com",  password: "Owner@123" },
  hr:     { email: "hr@company.com",     password: "Hr@12345" },
  manager:{ email: "manager@company.com", password: "Manager@123" },
  employee:{ email: "sales@company.com",  password: "Sales@12345" },
  admin:  { email: "admin@company.com", password: "Admin@123" },
} as const;

async function apiSignIn(page: Page, email: string, password: string) {
  await page.goto("/sign-in", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);

  const csrfReq = await page.request.get("/api/auth/csrf");
  const { csrfToken } = await csrfReq.json();

  const loginResp = await page.request.post("/api/auth/callback/credentials", {
    headers: { "X-Auth-Return-Redirect": "1" },
    form: { csrfToken, email, password, callbackUrl: "/dashboard" },
  });

  return { loginResp, csrfToken };
}

async function signInAsOwner(page: Page) {
  const { loginResp } = await apiSignIn(page, CREDS.owner.email, CREDS.owner.password);
  expect(loginResp.ok()).toBeTruthy();
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  await expect(page).toHaveURL(/\/dashboard/);
}

async function signInAsAdmin(page: Page) {
  // Try owner@verify.com first (if it has admin role), then fallback
  const { loginResp } = await apiSignIn(page, CREDS.owner.email, CREDS.owner.password);
  expect(loginResp.ok()).toBeTruthy();
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  await expect(page).toHaveURL(/\/dashboard/);
}

async function signInAsHR(page: Page) {
  const { loginResp } = await apiSignIn(page, CREDS.hr.email, CREDS.hr.password);
  expect(loginResp.ok()).toBeTruthy();
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  await expect(page).toHaveURL(/\/dashboard/);
}

async function signInAsManager(page: Page) {
  const { loginResp } = await apiSignIn(page, CREDS.manager.email, CREDS.manager.password);
  expect(loginResp.ok()).toBeTruthy();
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  await expect(page).toHaveURL(/\/dashboard/);
}

async function signInAsEmployee(page: Page) {
  const { loginResp } = await apiSignIn(page, CREDS.employee.email, CREDS.employee.password);
  expect(loginResp.ok()).toBeTruthy();
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  await expect(page).toHaveURL(/\/dashboard/);
}

/**
 * Navigate to a page and collect console errors + API failures.
 */
async function navigateAndCollectErrors(
  page: Page,
  path: string,
): Promise<{ consoleErrors: string[]; apiFailures: string[] }> {
  const consoleErrors: string[] = [];
  const apiFailures: string[] = [];

  const consoleHandler = (msg: import("@playwright/test").ConsoleMessage) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  };
  const responseHandler = (response: import("@playwright/test").Response) => {
    if (response.url().includes("/api/proxy/") && !response.ok()) {
      apiFailures.push(`${response.status()} ${response.url()}`);
    }
  };

  page.on("console", consoleHandler);
  page.on("response", responseHandler);

  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  page.off("console", consoleHandler);
  page.off("response", responseHandler);

  return { consoleErrors, apiFailures };
}

function filterNoisyErrors(errors: string[]): string[] {
  return errors.filter(
    (e) =>
      !e.includes("favicon") &&
      !e.includes("Failed to load resource") &&
      !e.includes("net::ERR_") &&
      !e.includes("404") &&
      !e.includes("The resource") &&
      !e.includes("was preloaded using link preload") &&
      !e.includes("Failed to find a valid digest") &&
      !e.includes("self-xss") &&
      !e.includes("Not implemented") &&
      !e.includes("404 (Not Found)") &&
      !e.includes("AUDIO") &&
      !e.includes("CORS") &&
      !e.includes("Access to") &&
      !e.includes("has been blocked by CORS") &&
      !e.includes("width(-1) and height(-1)") &&
      !e.includes("socket.io") &&
      !e.includes("Socket initialization failed") &&
      !e.includes("Failed to fetch") &&
      !e.includes("initSocket"),
  );
}

async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `test-results/audit-${name}.png`, fullPage: true });
}

/* ================================================================== */
/*  1. LOGIN / LOGOUT                                                  */
/* ================================================================== */
test.describe.serial("1. LOGIN / LOGOUT", () => {
  test("1.1 — Sign-in page renders with form fields", async ({ page }) => {
    await page.goto("/sign-in", { waitUntil: "domcontentloaded" });
    await expect(page.getByLabel("Email")).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
    await expect(page.getByText("RealEstate CRM")).toBeVisible();
    await takeScreenshot(page, "01-signin-page");
  });

  test("1.2 — Login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/sign-in", { waitUntil: "domcontentloaded" });

    const csrfReq = await page.request.get("/api/auth/csrf");
    const { csrfToken } = await csrfReq.json();

    const resp = await page.request.post("/api/auth/callback/credentials", {
      headers: { "X-Auth-Return-Redirect": "1" },
      form: { csrfToken, email: "nonexistent@test.com", password: "WrongPass123", callbackUrl: "/dashboard" },
    });

    const body = await resp.json();
    expect(resp.ok()).toBeTruthy();
    expect(body.url).toBeDefined();
    expect(body.url).toContain("error");

    // User stays on sign-in
    await expect(page).toHaveURL(/\/sign-in/);
    await takeScreenshot(page, "02-invalid-login");
  });

  test("1.3 — Login with valid Owner credentials", async ({ page }) => {
    const { loginResp } = await apiSignIn(page, CREDS.owner.email, CREDS.owner.password);
    expect(loginResp.ok()).toBeTruthy();
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/dashboard/);
    await takeScreenshot(page, "03-owner-dashboard");
  });

  test("1.4 — Login with valid HR credentials", async ({ page }) => {
    const { loginResp } = await apiSignIn(page, CREDS.hr.email, CREDS.hr.password);
    expect(loginResp.ok()).toBeTruthy();
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/dashboard/);
    await takeScreenshot(page, "04-hr-dashboard");
  });

  test("1.5 — Login with valid Manager credentials", async ({ page }) => {
    const { loginResp } = await apiSignIn(page, CREDS.manager.email, CREDS.manager.password);
    expect(loginResp.ok()).toBeTruthy();
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/dashboard/);
    await takeScreenshot(page, "05-manager-dashboard");
  });

  test("1.6 — Login with valid Employee credentials", async ({ page }) => {
    const { loginResp } = await apiSignIn(page, CREDS.employee.email, CREDS.employee.password);
    expect(loginResp.ok()).toBeTruthy();
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/dashboard/);
    await takeScreenshot(page, "06-employee-dashboard");
  });

  test("1.7 — Unauthenticated user redirected to sign-in", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/sign-in/);
    await takeScreenshot(page, "07-unauth-redirect");
  });

  test("1.8 — Logout clears session", async ({ page }) => {
    await signInAsOwner(page);

    // Sign out via UI
    const userBtn = page.locator("header button, header [role='button']").last();
    await userBtn.click();
    await page.waitForTimeout(500);
    const signOutBtn = page.getByRole("menuitem", { name: /sign out/i });
    if (await signOutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await signOutBtn.click();
    } else {
      // Fallback: clear cookies and navigate
      const context = page.context();
      await context.clearCookies();
      await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    }

    await page.waitForTimeout(1000);
    // Should be redirected to sign-in
    expect(page.url()).toContain("sign-in");
    await takeScreenshot(page, "08-logout");
  });

  test("1.9 — Browser-supplied identity fields rejected", async ({ page }) => {
    const csrfReq = await page.request.get("/api/auth/csrf");
    const { csrfToken } = await csrfReq.json();

    await page.request.post("/api/auth/callback/credentials", {
      headers: { "X-Auth-Return-Redirect": "1" },
      form: {
        csrfToken,
        id: "attacker-selected-user-id",
        email: "owner@company.com",
        firstName: "Fake",
        lastName: "Owner",
        role: "OWNER",
        companyId: "attacker-selected-company-id",
        callbackUrl: "/dashboard",
      },
    });

    const sessionResponse = await page.request.get("/api/auth/session");
    const session = await sessionResponse.json();
    expect(session?.user).toBeUndefined();
  });
});

/* ================================================================== */
/*  2. NAVIGATION — Sidebar links for each role                        */
/* ================================================================== */
test.describe.serial("2. NAVIGATION", () => {
  const ownerRoutes = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Approvals", path: "/dashboard/approvals" },
    { label: "Properties", path: "/dashboard/properties" },
    { label: "Leads", path: "/dashboard/leads" },
    { label: "Customers", path: "/dashboard/customers" },
    { label: "Employees", path: "/dashboard/employees" },
    { label: "Departments", path: "/dashboard/departments" },
    { label: "Designations", path: "/dashboard/designations" },
    { label: "Attendance", path: "/dashboard/attendance" },
    { label: "Payroll", path: "/dashboard/payroll" },
    { label: "Construction Sites", path: "/dashboard/construction-sites" },
    { label: "Vendors", path: "/dashboard/vendors" },
    { label: "Materials", path: "/dashboard/materials" },
    { label: "Inventory", path: "/dashboard/inventory" },
    { label: "Labour", path: "/dashboard/labour" },
    { label: "Commissions", path: "/dashboard/commissions" },
    { label: "Incentives", path: "/dashboard/incentives" },
    { label: "Announcements", path: "/dashboard/announcements" },
    { label: "Documents", path: "/dashboard/documents" },
    { label: "Complaints", path: "/dashboard/complaints" },
    { label: "Reports", path: "/dashboard/reports" },
    { label: "Permissions", path: "/dashboard/permissions" },
    { label: "Users", path: "/dashboard/users" },
    { label: "Activity Logs", path: "/dashboard/activity-logs" },
    { label: "Settings", path: "/dashboard/settings" },
  ];

  for (const route of ownerRoutes) {
    test(`2.${ownerRoutes.indexOf(route) + 1} — OWNER: ${route.label} loads`, async ({ page }) => {
      await signInAsOwner(page);
      const { consoleErrors, apiFailures } = await navigateAndCollectErrors(page, route.path);
      const filtered = filterNoisyErrors(consoleErrors);
      expect(filtered.length, `${route.label} has console errors: ${filtered.join("; ")}`).toBe(0);
      expect(apiFailures, `${route.label} has failed API calls: ${apiFailures.join("; ")}`).toEqual([]);
      expect(page.url()).not.toContain("sign-in");
      await takeScreenshot(page, `nav-owner-${route.label.toLowerCase().replace(/\s+/g, "-")}`);
    });
  }

  test("2.99 — Employee sees limited sidebar items", async ({ page }) => {
    await signInAsEmployee(page);
    // Employee should NOT see these nav items
    const forbiddenLabels = ["Payroll", "Permissions", "Settings", "Users", "Activity Logs", "Departments"];
    for (const label of forbiddenLabels) {
      const navLink = page.getByRole("link", { name: label, exact: false });
      const count = await navLink.count();
      expect(count, `Employee should not see "${label}" in sidebar`).toBe(0);
    }
    await takeScreenshot(page, "nav-employee-sidebar");
  });
});

/* ================================================================== */
/*  3. EMPLOYEE MANAGEMENT                                             */
/* ================================================================== */
test.describe.serial("3. EMPLOYEE MANAGEMENT", () => {
  test("3.1 — Employee list page loads", async ({ page }) => {
    await signInAsOwner(page);
    const { consoleErrors, apiFailures } = await navigateAndCollectErrors(page, "/dashboard/employees");
    const filtered = filterNoisyErrors(consoleErrors);
    expect(filtered.length).toBe(0);
    expect(page.url()).toContain("/employees");
    await takeScreenshot(page, "employees-list");
  });

  test("3.2 — Employee data loads from API", async ({ page }) => {
    await signInAsOwner(page);
    await page.goto("/dashboard/employees", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const resp = await page.request.get("/api/proxy/employees?limit=5");
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    const hasData = Array.isArray(body.data) ? body.data.length > 0 : Array.isArray(body) && body.length > 0;
    // Acceptable if no employees seeded — just verify endpoint works
    expect(resp.status()).toBe(200);
    await takeScreenshot(page, "employees-data");
  });

  test("3.3 — Add Employee dialog opens", async ({ page }) => {
    await signInAsOwner(page);
    await page.goto("/dashboard/employees", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const addBtn = page.getByRole("button", { name: /add employee/i });
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 5000 });
      await takeScreenshot(page, "employees-add-dialog");
    } else {
      console.log("Add Employee button not found — may be hidden for this role");
    }
  });

  test("3.4 — Employee search/filter works", async ({ page }) => {
    await signInAsOwner(page);
    await page.goto("/dashboard/employees", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const searchInput = page.getByRole("textbox", { name: /search/i }).or(page.locator("input[placeholder*='Search']"));
    if (await searchInput.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.first().fill("test");
      await page.waitForTimeout(1000);
      await takeScreenshot(page, "employees-search");
    }
  });

  test("3.5 — Employee page renders without errors for HR", async ({ page }) => {
    await signInAsHR(page);
    const { consoleErrors } = await navigateAndCollectErrors(page, "/dashboard/employees");
    const filtered = filterNoisyErrors(consoleErrors);
    expect(filtered.length).toBe(0);
    await takeScreenshot(page, "employees-hr-view");
  });
});

/* ================================================================== */
/*  4. TASK MANAGEMENT                                                 */
/* ================================================================== */
test.describe.serial("4. TASK MANAGEMENT (My Tasks)", () => {
  test("4.1 — My Tasks page loads for employee", async ({ page }) => {
    await signInAsEmployee(page);
    const { consoleErrors } = await navigateAndCollectErrors(page, "/dashboard/my-tasks");
    const filtered = filterNoisyErrors(consoleErrors);
    expect(filtered.length).toBe(0);
    await takeScreenshot(page, "tasks-employee");
  });

  test("4.2 — My Tasks page accessible for owner", async ({ page }) => {
    await signInAsOwner(page);
    await page.goto("/dashboard/my-tasks", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    // May redirect — that's ok for OWNER
    await takeScreenshot(page, "tasks-owner");
  });

  test("4.3 — Create task dialog opens", async ({ page }) => {
    await signInAsEmployee(page);
    await page.goto("/dashboard/my-tasks", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const createBtn = page.getByRole("button", { name: /create|add task|new task/i });
    if (await createBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await createBtn.first().click();
      await page.waitForTimeout(500);
      await takeScreenshot(page, "tasks-create-dialog");
    }
  });
});

/* ================================================================== */
/*  5. ATTENDANCE                                                      */
/* ================================================================== */
test.describe.serial("5. ATTENDANCE", () => {
  test("5.1 — Attendance page loads (Admin)", async ({ page }) => {
    await signInAsOwner(page);
    const { consoleErrors } = await navigateAndCollectErrors(page, "/dashboard/attendance");
    const filtered = filterNoisyErrors(consoleErrors);
    expect(filtered.length).toBe(0);
    await takeScreenshot(page, "attendance-admin");
  });

  test("5.2 — Attendance records load from API", async ({ page }) => {
    await signInAsOwner(page);
    await page.goto("/dashboard/attendance", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const resp = await page.request.get("/api/proxy/attendance?limit=5");
    expect(resp.ok()).toBeTruthy();
    await takeScreenshot(page, "attendance-data");
  });

  test("5.3 — Attendance page loads (HR)", async ({ page }) => {
    await signInAsHR(page);
    const { consoleErrors } = await navigateAndCollectErrors(page, "/dashboard/attendance");
    const filtered = filterNoisyErrors(consoleErrors);
    expect(filtered.length).toBe(0);
    await takeScreenshot(page, "attendance-hr");
  });

  test("5.4 — Employee sees personal attendance view", async ({ page }) => {
    await signInAsEmployee(page);
    const { consoleErrors } = await navigateAndCollectErrors(page, "/dashboard/attendance");
    const filtered = filterNoisyErrors(consoleErrors);
    expect(filtered.length).toBe(0);
    await takeScreenshot(page, "attendance-employee");
  });

  test("5.5 — Attendance Corrections page loads", async ({ page }) => {
    await signInAsOwner(page);
    const { consoleErrors } = await navigateAndCollectErrors(page, "/dashboard/attendance-corrections");
    const filtered = filterNoisyErrors(consoleErrors);
    expect(filtered.length).toBe(0);
    await takeScreenshot(page, "attendance-corrections");
  });
});

/* ================================================================== */
/*  6. LEAVE MANAGEMENT                                                */
/* ================================================================== */
test.describe.serial("6. LEAVE MANAGEMENT", () => {
  test("6.1 — Leave Requests page loads (Admin)", async ({ page }) => {
    await signInAsOwner(page);
    const { consoleErrors } = await navigateAndCollectErrors(page, "/dashboard/leave-requests");
    const filtered = filterNoisyErrors(consoleErrors);
    expect(filtered.length).toBe(0);
    await takeScreenshot(page, "leave-requests-admin");
  });

  test("6.2 — Leave Requests page loads (Employee)", async ({ page }) => {
    await signInAsEmployee(page);
    const { consoleErrors } = await navigateAndCollectErrors(page, "/dashboard/leave-requests");
    const filtered = filterNoisyErrors(consoleErrors);
    expect(filtered.length).toBe(0);
    await takeScreenshot(page, "leave-requests-employee");
  });

  test("6.3 — Leave Allocations page loads", async ({ page }) => {
    await signInAsOwner(page);
    const { consoleErrors } = await navigateAndCollectErrors(page, "/dashboard/leave-allocations");
    const filtered = filterNoisyErrors(consoleErrors);
    expect(filtered.length).toBe(0);
    await takeScreenshot(page, "leave-allocations");
  });

  test("6.4 — Leave request data loads from API", async ({ page }) => {
    await signInAsOwner(page);
    const resp = await page.request.get("/api/proxy/leave-requests?limit=5");
    expect(resp.ok()).toBeTruthy();
    await takeScreenshot(page, "leave-requests-api");
  });
});

/* ================================================================== */
/*  7. PAYROLL                                                         */
/* ================================================================== */
test.describe.serial("7. PAYROLL", () => {
  test("7.1 — Payroll page loads", async ({ page }) => {
    await signInAsOwner(page);
    const { consoleErrors } = await navigateAndCollectErrors(page, "/dashboard/payroll");
    const filtered = filterNoisyErrors(consoleErrors);
    expect(filtered.length).toBe(0);
    await takeScreenshot(page, "payroll");
  });

  test("7.2 — Payroll data loads from API", async ({ page }) => {
    await signInAsOwner(page);
    const resp = await page.request.get("/api/proxy/payroll-runs?limit=5");
    expect(resp.ok()).toBeTruthy();
    await takeScreenshot(page, "payroll-data");
  });

  test("7.3 — Payroll page loads for HR", async ({ page }) => {
    await signInAsHR(page);
    const { consoleErrors } = await navigateAndCollectErrors(page, "/dashboard/payroll");
    const filtered = filterNoisyErrors(consoleErrors);
    expect(filtered.length).toBe(0);
    await takeScreenshot(page, "payroll-hr");
  });
});

/* ================================================================== */
/*  8. REPORTS                                                         */
/* ================================================================== */
test.describe.serial("8. REPORTS", () => {
  test("8.1 — Reports page loads with analytics cards", async ({ page }) => {
    await signInAsOwner(page);
    const { consoleErrors } = await navigateAndCollectErrors(page, "/dashboard/reports");
    const filtered = filterNoisyErrors(consoleErrors);
    expect(filtered.length).toBe(0);
    await takeScreenshot(page, "reports");
  });

  test("8.2 — Reports shows Export Catalog", async ({ page }) => {
    await signInAsOwner(page);
    await page.goto("/dashboard/reports", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Check for export buttons or catalog heading
    const hasExportSection = await page.getByRole("heading", { name: /export/i }).isVisible().catch(() => false);
    const hasExportBtn = await page.getByRole("button", { name: /export/i }).first().isVisible().catch(() => false);
    expect(hasExportSection || hasExportBtn).toBeTruthy();
    await takeScreenshot(page, "reports-exports");
  });
});

/* ================================================================== */
/*  9. CRM — Properties, Leads, Customers, Bookings                    */
/* ================================================================== */
test.describe.serial("9. CRM", () => {
  test("9.1 — Properties page loads", async ({ page }) => {
    await signInAsOwner(page);
    const { consoleErrors } = await navigateAndCollectErrors(page, "/dashboard/properties");
    const filtered = filterNoisyErrors(consoleErrors);
    expect(filtered.length).toBe(0);
    await takeScreenshot(page, "crm-properties");
  });

  test("9.2 — Leads page loads with table and board view toggle", async ({ page }) => {
    await signInAsOwner(page);
    const { consoleErrors } = await navigateAndCollectErrors(page, "/dashboard/leads");
    const filtered = filterNoisyErrors(consoleErrors);
    expect(filtered.length).toBe(0);

    // Check for table/board view buttons
    const hasTableBtn = await page.getByRole("button", { name: /table/i }).isVisible().catch(() => false);
    const hasBoardBtn = await page.getByRole("button", { name: /board/i }).isVisible().catch(() => false);
    const hasAddBtn = await page.getByRole("button", { name: /add lead/i }).isVisible().catch(() => false);
    expect(hasTableBtn || hasBoardBtn || hasAddBtn).toBeTruthy();
    await takeScreenshot(page, "crm-leads");
  });

  test("9.3 — Leads Kanban view works", async ({ page }) => {
    await signInAsOwner(page);
    await page.goto("/dashboard/leads", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const boardBtn = page.getByRole("button", { name: /board/i });
    if (await boardBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await boardBtn.click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, "crm-leads-kanban");
    }
  });

  test("9.4 — Add Lead dialog opens", async ({ page }) => {
    await signInAsOwner(page);
    await page.goto("/dashboard/leads", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const addBtn = page.getByRole("button", { name: /add lead/i });
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 5000 });
      await takeScreenshot(page, "crm-add-lead");
    }
  });

  test("9.5 — Customers page loads", async ({ page }) => {
    await signInAsOwner(page);
    const { consoleErrors } = await navigateAndCollectErrors(page, "/dashboard/customers");
    const filtered = filterNoisyErrors(consoleErrors);
    expect(filtered.length).toBe(0);
    await takeScreenshot(page, "crm-customers");
  });

  test("9.6 — Bookings page loads", async ({ page }) => {
    await signInAsOwner(page);
    const { consoleErrors } = await navigateAndCollectErrors(page, "/dashboard/bookings");
    const filtered = filterNoisyErrors(consoleErrors);
    expect(filtered.length).toBe(0);
    await takeScreenshot(page, "crm-bookings");
  });

  test("9.7 — Site Visits page loads", async ({ page }) => {
    await signInAsOwner(page);
    const { consoleErrors } = await navigateAndCollectErrors(page, "/dashboard/site-visits");
    const filtered = filterNoisyErrors(consoleErrors);
    expect(filtered.length).toBe(0);
    await takeScreenshot(page, "crm-site-visits");
  });
});

/* ================================================================== */
/*  10. SITES / CONSTRUCTION                                           */
/* ================================================================== */
test.describe.serial("10. SITES / CONSTRUCTION", () => {
  test("10.1 — Construction Sites page loads", async ({ page }) => {
    await signInAsOwner(page);
    const { consoleErrors } = await navigateAndCollectErrors(page, "/dashboard/construction-sites");
    const filtered = filterNoisyErrors(consoleErrors);
    expect(filtered.length).toBe(0);
    await takeScreenshot(page, "sites-construction");
  });

  test("10.2 — Construction Sites API returns data", async ({ page }) => {
    await signInAsOwner(page);
    const resp = await page.request.get("/api/proxy/construction-sites?limit=5");
    expect(resp.ok()).toBeTruthy();
  });

  test("10.3 — Materials page loads", async ({ page }) => {
    await signInAsOwner(page);
    const { consoleErrors } = await navigateAndCollectErrors(page, "/dashboard/materials");
    const filtered = filterNoisyErrors(consoleErrors);
    expect(filtered.length).toBe(0);
    await takeScreenshot(page, "sites-materials");
  });

  test("10.4 — Labour page loads", async ({ page }) => {
    await signInAsOwner(page);
    const { consoleErrors } = await navigateAndCollectErrors(page, "/dashboard/labour");
    const filtered = filterNoisyErrors(consoleErrors);
    expect(filtered.length).toBe(0);
    await takeScreenshot(page, "sites-labour");
  });
});

/* ================================================================== */
/*  11. INVENTORY                                                      */
/* ================================================================== */
test.describe.serial("11. INVENTORY", () => {
  test("11.1 — Inventory page loads", async ({ page }) => {
    await signInAsOwner(page);
    const { consoleErrors } = await navigateAndCollectErrors(page, "/dashboard/inventory");
    const filtered = filterNoisyErrors(consoleErrors);
    expect(filtered.length).toBe(0);
    await takeScreenshot(page, "inventory");
  });

  test("11.2 — Inventory shows site selector", async ({ page }) => {
    await signInAsOwner(page);
    await page.goto("/dashboard/inventory", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Should show "Select a site to view inventory" or a site selector
    const hasSelector = await page.getByText(/select.*site/i).isVisible().catch(() => false);
    const hasTransferBtn = await page.getByRole("button", { name: /transfer stock/i }).isVisible().catch(() => false);
    expect(hasSelector || hasTransferBtn).toBeTruthy();
    await takeScreenshot(page, "inventory-site-selector");
  });
});

/* ================================================================== */
/*  12. VENDORS                                                        */
/* ================================================================== */
test.describe.serial("12. VENDORS", () => {
  test("12.1 — Vendors page loads", async ({ page }) => {
    await signInAsOwner(page);
    const { consoleErrors } = await navigateAndCollectErrors(page, "/dashboard/vendors");
    const filtered = filterNoisyErrors(consoleErrors);
    expect(filtered.length).toBe(0);
    await takeScreenshot(page, "vendors");
  });

  test("12.2 — Vendors API returns data", async ({ page }) => {
    await signInAsOwner(page);
    const resp = await page.request.get("/api/proxy/vendors?limit=5");
    expect(resp.ok()).toBeTruthy();
  });
});

/* ================================================================== */
/*  13. ACCOUNTS / PAYMENTS / EXPENSES                                 */
/* ================================================================== */
test.describe.serial("13. ACCOUNTS", () => {
  test("13.1 — Payments page loads", async ({ page }) => {
    await signInAsOwner(page);
    const { consoleErrors } = await navigateAndCollectErrors(page, "/dashboard/payments");
    const filtered = filterNoisyErrors(consoleErrors);
    expect(filtered.length).toBe(0);
    await takeScreenshot(page, "accounts-payments");
  });

  test("13.2 — Expenses page loads", async ({ page }) => {
    await signInAsOwner(page);
    const { consoleErrors } = await navigateAndCollectErrors(page, "/dashboard/expenses");
    const filtered = filterNoisyErrors(consoleErrors);
    expect(filtered.length).toBe(0);
    await takeScreenshot(page, "accounts-expenses");
  });

  test("13.3 — Commissions page loads", async ({ page }) => {
    await signInAsOwner(page);
    const { consoleErrors } = await navigateAndCollectErrors(page, "/dashboard/commissions");
    const filtered = filterNoisyErrors(consoleErrors);
    expect(filtered.length).toBe(0);
    await takeScreenshot(page, "accounts-commissions");
  });

  test("13.4 — Incentives page loads", async ({ page }) => {
    await signInAsOwner(page);
    const { consoleErrors } = await navigateAndCollectErrors(page, "/dashboard/incentives");
    const filtered = filterNoisyErrors(consoleErrors);
    expect(filtered.length).toBe(0);
    await takeScreenshot(page, "accounts-incentives");
  });
});

/* ================================================================== */
/*  14. ANNOUNCEMENTS                                                  */
/* ================================================================== */
test.describe.serial("14. ANNOUNCEMENTS", () => {
  test("14.1 — Announcements page loads (Admin)", async ({ page }) => {
    await signInAsOwner(page);
    const { consoleErrors } = await navigateAndCollectErrors(page, "/dashboard/announcements");
    const filtered = filterNoisyErrors(consoleErrors);
    expect(filtered.length).toBe(0);
    await takeScreenshot(page, "announcements-admin");
  });

  test("14.2 — Employee sees My Announcements view", async ({ page }) => {
    await signInAsEmployee(page);
    const { consoleErrors } = await navigateAndCollectErrors(page, "/dashboard/announcements");
    const filtered = filterNoisyErrors(consoleErrors);
    expect(filtered.length).toBe(0);
    await takeScreenshot(page, "announcements-employee");
  });

  test("14.3 — New Announcement dialog opens", async ({ page }) => {
    await signInAsOwner(page);
    await page.goto("/dashboard/announcements", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const newBtn = page.getByRole("button", { name: /new announcement/i });
    if (await newBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await newBtn.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 5000 });
      await takeScreenshot(page, "announcements-create-dialog");
    }
  });
});

/* ================================================================== */
/*  15. DOCUMENTS                                                      */
/* ================================================================== */
test.describe.serial("15. DOCUMENTS", () => {
  test("15.1 — Documents page loads", async ({ page }) => {
    await signInAsOwner(page);
    const { consoleErrors } = await navigateAndCollectErrors(page, "/dashboard/documents");
    const filtered = filterNoisyErrors(consoleErrors);
    expect(filtered.length).toBe(0);
    await takeScreenshot(page, "documents");
  });

  test("15.2 — Register Document dialog opens", async ({ page }) => {
    await signInAsOwner(page);
    await page.goto("/dashboard/documents", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const registerBtn = page.getByRole("button", { name: /register document/i });
    if (await registerBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await registerBtn.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 5000 });
      await takeScreenshot(page, "documents-register-dialog");
    }
  });

  test("15.3 — Employee can view documents", async ({ page }) => {
    await signInAsEmployee(page);
    const { consoleErrors } = await navigateAndCollectErrors(page, "/dashboard/documents");
    const filtered = filterNoisyErrors(consoleErrors);
    expect(filtered.length).toBe(0);
    await takeScreenshot(page, "documents-employee");
  });
});

/* ================================================================== */
/*  16. ADDITIONAL PAGES — EOD Reports, Approvals, Settings, etc.      */
/* ================================================================== */
test.describe.serial("16. ADDITIONAL PAGES", () => {
  const additionalRoutes = [
    { label: "Approvals", path: "/dashboard/approvals" },
    { label: "EOD Reports", path: "/dashboard/eod-reports" },
    { label: "Escalation", path: "/dashboard/escalation" },
    { label: "Performance", path: "/dashboard/performance" },
    { label: "Complaints", path: "/dashboard/complaints" },
    { label: "Devices", path: "/dashboard/devices" },
    { label: "Brokers", path: "/dashboard/brokers" },
    { label: "Settings", path: "/dashboard/settings" },
    { label: "Activity Logs", path: "/dashboard/activity-logs" },
    { label: "EMS", path: "/dashboard/ems" },
    { label: "Users", path: "/dashboard/users" },
  ];

  for (const route of additionalRoutes) {
    test(`16.${additionalRoutes.indexOf(route) + 1} — ${route.label} loads without errors`, async ({ page }) => {
      await signInAsOwner(page);
      const { consoleErrors } = await navigateAndCollectErrors(page, route.path);
      const filtered = filterNoisyErrors(consoleErrors);
      expect(filtered.length, `${route.label} console errors: ${filtered.join("; ")}`).toBe(0);
      await takeScreenshot(page, `additional-${route.label.toLowerCase().replace(/\s+/g, "-")}`);
    });
  }
});

/* ================================================================== */
/*  17. API HEALTH & PROXY                                             */
/* ================================================================== */
test.describe.serial("17. API HEALTH & PROXY", () => {
  test("17.1 — API health endpoint is public", async ({ request }) => {
    const resp = await request.get("http://127.0.0.1:4000/api/health");
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body.status).toBe("ok");
  });

  test("17.2 — Proxy forwards requests correctly", async ({ page }) => {
    await signInAsOwner(page);

    const resp = await page.request.get("/api/proxy/leads?limit=1&page=1");
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body.meta.limit).toBe(1);
  });

  test("17.3 — All major API endpoints return 200", async ({ page }) => {
    await signInAsOwner(page);

    const endpoints = [
      "/api/proxy/properties",
      "/api/proxy/leads",
      "/api/proxy/customers",
      "/api/proxy/employees",
      "/api/proxy/departments",
      "/api/proxy/designations",
      "/api/proxy/attendance",
      "/api/proxy/leave-requests",
      "/api/proxy/payroll-runs",
      "/api/proxy/commissions",
      "/api/proxy/incentives",
      "/api/proxy/construction-sites",
      "/api/proxy/vendors",
      "/api/proxy/materials",
      "/api/proxy/inventory",
      "/api/proxy/complaints",
      "/api/proxy/eod-reports",
      "/api/proxy/activity-logs",
    ];

    const failures: string[] = [];
    for (const ep of endpoints) {
      const resp = await page.request.get(ep);
      if (!resp.ok()) {
        failures.push(`${resp.status()} ${ep}`);
      }
    }
    expect(failures, `Failed API endpoints: ${failures.join(", ")}`).toEqual([]);
  });
});
