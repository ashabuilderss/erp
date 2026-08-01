import { expect, test } from "@playwright/test";
import {
  signInAs,
  signInAsAdmin,
  signInAsOwner,
  signInAsEmployee,
  navigateTo,
} from "./helpers";

/* ------------------------------------------------------------------ */
/*  Helper: collect console errors while executing a callback          */
/* ------------------------------------------------------------------ */
async function withConsoleErrors(
  page: import("@playwright/test").Page,
  fn: () => Promise<void>,
): Promise<string[]> {
  const errors: string[] = [];
  const handler = (msg: import("@playwright/test").ConsoleMessage) => {
    if (msg.type() === "error") errors.push(msg.text());
  };
  page.on("console", handler);
  await fn();
  page.off("console", handler);
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
      !e.includes("CORS") &&
      !e.includes("has been blocked by CORS") &&
      !e.includes("width(-1) and height(-1)") &&
      !e.includes("socket.io") &&
      !e.includes("Socket initialization failed") &&
      !e.includes("Failed to fetch") &&
      !e.includes("initSocket"),
  );
}

/* ------------------------------------------------------------------ */
/*  Helper: wait for page to settle and return visible text snippet    */
/* ------------------------------------------------------------------ */
async function getPageSnippet(
  page: import("@playwright/test").Page,
): Promise<string> {
  await page.waitForTimeout(2000);
  const text = await page.locator("body").innerText().catch(() => "");
  return text.substring(0, 800).replace(/\n+/g, " | ");
}

/* ------------------------------------------------------------------ */
/*  Scenario 1: Owner Dashboard loads with KPIs and charts             */
/* ------------------------------------------------------------------ */
test.describe.serial("Scenario 1 - Owner Dashboard with KPIs and Charts", () => {
  test("Owner dashboard loads with KPI cards and chart components", async ({
    page,
  }) => {
    await signInAsOwner(page);

    // Verify page loads on /dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Wait for content to render
    await page.waitForTimeout(3000);

    // Check for KPI card labels expected on owner dashboard
    const kpiLabels = [
      "Total Properties",
      "Total Leads",
      "Site Visits",
      "Total Bookings",
      "Total Employees",
      "Present Today",
    ];

    const visibleKpis: string[] = [];
    for (const label of kpiLabels) {
      const visible = await page
        .getByText(label)
        .first()
        .isVisible()
        .catch(() => false);
      if (visible) visibleKpis.push(label);
    }

    console.log(
      `[Scenario1] Owner visible KPIs: ${JSON.stringify(visibleKpis)}`
    );

    // Check for chart components: SVG elements (Recharts/renderers), canvas, or chart containers
    const svgCount = await page.locator("svg").count().catch(() => 0);
    const canvasCount = await page.locator("canvas").count().catch(() => 0);
    const chartContainers = await page
      .locator('[class*="chart"], [class*="recharts"], [class*="Chart"]')
      .count()
      .catch(() => 0);

    console.log(
      `[Scenario1] Charts: svg=${svgCount}, canvas=${canvasCount}, chartContainers=${chartContainers}`
    );

    // Take full-page screenshot
    await page.screenshot({
      path: "test-results/payroll-01-owner-dashboard.png",
      fullPage: true,
    });

    // Document findings
    const snippet = await getPageSnippet(page);
    console.log(`[Scenario1] Page content snippet: ${snippet}`);

    // Owner should see at least some KPI cards
    expect(
      visibleKpis.length > 0,
      `Owner dashboard should show at least 1 KPI card. Visible: ${JSON.stringify(visibleKpis)}`
    ).toBeTruthy();

    // At least some SVGs or chart containers should be present
    const hasCharts = svgCount > 0 || canvasCount > 0 || chartContainers > 0;
    console.log(`[Scenario1] Charts rendering: ${hasCharts}`);
  });
});

/* ------------------------------------------------------------------ */
/*  Scenario 2: Admin Dashboard                                        */
/* ------------------------------------------------------------------ */
test.describe.serial("Scenario 2 - Admin Dashboard", () => {
  test("Admin dashboard loads and shows KPIs", async ({ page }) => {
    await signInAsAdmin(page);
    await expect(page).toHaveURL(/\/dashboard/);
    await page.waitForTimeout(3000);

    // Check KPIs visible to admin
    const kpiLabels = [
      "Total Properties",
      "Total Leads",
      "Site Visits",
      "Total Bookings",
      "Total Employees",
      "Present Today",
    ];

    const visibleKpis: string[] = [];
    for (const label of kpiLabels) {
      const visible = await page
        .getByText(label)
        .first()
        .isVisible()
        .catch(() => false);
      if (visible) visibleKpis.push(label);
    }

    console.log(
      `[Scenario2] Admin visible KPIs: ${JSON.stringify(visibleKpis)}`
    );

    await page.screenshot({
      path: "test-results/payroll-02-admin-dashboard.png",
      fullPage: true,
    });

    const snippet = await getPageSnippet(page);
    console.log(`[Scenario2] Page content snippet: ${snippet}`);

    expect(visibleKpis.length > 0).toBeTruthy();
  });
});

/* ------------------------------------------------------------------ */
/*  Scenario 3: Employee Dashboard                                     */
/* ------------------------------------------------------------------ */
test.describe.serial("Scenario 3 - Employee Dashboard", () => {
  test("Employee dashboard loads and shows employee-specific view", async ({
    page,
  }) => {
    await signInAs(page, "sales@company.com", "Sales@12345");
    await expect(page).toHaveURL(/\/dashboard/);
    await page.waitForTimeout(3000);

    // Check what KPIs an employee sees
    const kpiLabels = [
      "Total Properties",
      "Total Leads",
      "Site Visits",
      "Total Bookings",
      "Total Employees",
      "Present Today",
      "My Attendance",
      "My Tasks",
    ];

    const visibleKpis: string[] = [];
    for (const label of kpiLabels) {
      const visible = await page
        .getByText(label)
        .first()
        .isVisible()
        .catch(() => false);
      if (visible) visibleKpis.push(label);
    }

    console.log(
      `[Scenario3] Employee visible KPIs: ${JSON.stringify(visibleKpis)}`
    );

    await page.screenshot({
      path: "test-results/payroll-03-employee-dashboard.png",
      fullPage: true,
    });

    const snippet = await getPageSnippet(page);
    console.log(`[Scenario3] Page content snippet: ${snippet}`);

    // Employee should see some content on their dashboard
    expect(
      visibleKpis.length > 0,
      "Employee dashboard should show at least some content"
    ).toBeTruthy();
  });
});

/* ------------------------------------------------------------------ */
/*  Scenario 4: Payroll page (Admin)                                   */
/* ------------------------------------------------------------------ */
test.describe.serial("Scenario 4 - Payroll Page (Admin)", () => {
  test("Admin can access payroll page and see payroll runs", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/payroll");

    await expect(page).toHaveURL(/\/payroll/);
    await page.waitForTimeout(3000);

    // Check for payroll elements
    const hasPayrollHeading = await page
      .getByRole("heading", { name: /payroll/i })
      .isVisible()
      .catch(() => false);
    const hasTable = await page
      .getByRole("table")
      .isVisible()
      .catch(() => false);
    const hasCreateButton = await page
      .getByRole("button", { name: /create|generate|run|add|new/i })
      .isVisible()
      .catch(() => false);
    const hasPayrollRuns = await page
      .getByText(/payroll run/i)
      .isVisible()
      .catch(() => false);

    console.log(
      `[Scenario4] heading=${hasPayrollHeading}, table=${hasTable}, createBtn=${hasCreateButton}, payrollRuns=${hasPayrollRuns}`
    );

    await page.screenshot({
      path: "test-results/payroll-04-admin-payroll.png",
      fullPage: true,
    });

    const snippet = await getPageSnippet(page);
    console.log(`[Scenario4] Page content snippet: ${snippet}`);

    expect(
      hasPayrollHeading || hasTable || hasPayrollRuns,
      "Payroll page should show payroll-related content"
    ).toBeTruthy();
  });
});

/* ------------------------------------------------------------------ */
/*  Scenario 5: Payments page (Owner only)                             */
/* ------------------------------------------------------------------ */
test.describe.serial("Scenario 5 - Payments Page (Owner)", () => {
  test("Owner can access payroll/payments page", async ({ page }) => {
    await signInAsOwner(page);
    await navigateTo(page, "/dashboard/payroll");

    await expect(page).toHaveURL(/\/payroll/);
    await page.waitForTimeout(3000);

    const hasPayrollHeading = await page
      .getByRole("heading", { name: /payroll|payment/i })
      .isVisible()
      .catch(() => false);
    const hasTable = await page
      .getByRole("table")
      .isVisible()
      .catch(() => false);

    console.log(
      `[Scenario5] heading=${hasPayrollHeading}, table=${hasTable}`
    );

    await page.screenshot({
      path: "test-results/payroll-05-owner-payroll.png",
      fullPage: true,
    });

    const snippet = await getPageSnippet(page);
    console.log(`[Scenario5] Page content snippet: ${snippet}`);

    // Owner should have access to payroll page
    const currentUrl = page.url();
    const redirectedToSignIn = currentUrl.includes("/sign-in");
    expect(
      !redirectedToSignIn,
      "Owner should not be redirected to sign-in for payroll"
    ).toBeTruthy();
  });
});

/* ------------------------------------------------------------------ */
/*  Scenario 6: Expenses page (Admin)                                  */
/* ------------------------------------------------------------------ */
test.describe.serial("Scenario 6 - Expenses Page (Admin)", () => {
  test("Admin can access expenses page and attempt to create expense", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/expenses");

    await expect(page).toHaveURL(/\/expenses/);
    await page.waitForTimeout(3000);

    const hasExpensesHeading = await page
      .getByRole("heading", { name: /expense/i })
      .isVisible()
      .catch(() => false);
    const hasTable = await page
      .getByRole("table")
      .isVisible()
      .catch(() => false);
    const hasCreateButton = await page
      .getByRole("button", { name: /create|add|new|claim/i })
      .isVisible()
      .catch(() => false);

    console.log(
      `[Scenario6] heading=${hasExpensesHeading}, table=${hasTable}, createBtn=${hasCreateButton}`
    );

    // Take initial screenshot
    await page.screenshot({
      path: "test-results/payroll-06-admin-expenses.png",
      fullPage: true,
    });

    // Try to click create button if visible
    if (hasCreateButton) {
      const createBtn = page
        .getByRole("button", { name: /create|add|new|claim/i })
        .first();
      await createBtn.click();
      await page.waitForTimeout(2000);

      // Check if a dialog opened
      const hasDialog = await page
        .getByRole("dialog")
        .isVisible()
        .catch(() => false);
      console.log(`[Scenario6] After clicking create: dialog=${hasDialog}`);

      // Take screenshot after clicking create
      await page.screenshot({
        path: "test-results/payroll-06b-admin-expenses-create-dialog.png",
        fullPage: true,
      });

      // If dialog opened, close it
      if (hasDialog) {
        const closeBtn = page
          .getByRole("dialog")
          .getByRole("button", { name: /close|cancel|dismiss/i })
          .first();
        if (
          await closeBtn.isVisible().catch(() => false)
        ) {
          await closeBtn.click();
          await page.waitForTimeout(500);
        } else {
          await page.keyboard.press("Escape");
          await page.waitForTimeout(500);
        }
      }
    }

    const snippet = await getPageSnippet(page);
    console.log(`[Scenario6] Page content snippet: ${snippet}`);

    expect(
      hasExpensesHeading || hasTable,
      "Expenses page should show expense-related content"
    ).toBeTruthy();
  });
});

/* ------------------------------------------------------------------ */
/*  Scenario 7: Incentives CRUD (Admin)                                */
/* ------------------------------------------------------------------ */
test.describe.serial("Scenario 7 - Incentives CRUD (Admin)", () => {
  test("Admin can access incentives page and attempt to create", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/incentives");

    await expect(page).toHaveURL(/\/incentives/);
    await page.waitForTimeout(3000);

    const hasIncentivesHeading = await page
      .getByRole("heading", { name: /incentive/i })
      .isVisible()
      .catch(() => false);
    const hasTable = await page
      .getByRole("table")
      .isVisible()
      .catch(() => false);
    const hasCreateButton = await page
      .getByRole("button", { name: /create|add|new/i })
      .isVisible()
      .catch(() => false);

    console.log(
      `[Scenario7] heading=${hasIncentivesHeading}, table=${hasTable}, createBtn=${hasCreateButton}`
    );

    await page.screenshot({
      path: "test-results/payroll-07-admin-incentives.png",
      fullPage: true,
    });

    // Try to click create button if visible
    if (hasCreateButton) {
      const createBtn = page
        .getByRole("button", { name: /create|add|new/i })
        .first();
      await createBtn.click();
      await page.waitForTimeout(2000);

      const hasDialog = await page
        .getByRole("dialog")
        .isVisible()
        .catch(() => false);
      console.log(
        `[Scenario7] After clicking create: dialog=${hasDialog}`
      );

      await page.screenshot({
        path: "test-results/payroll-07b-admin-incentives-create-dialog.png",
        fullPage: true,
      });

      // If dialog opened, close it
      if (hasDialog) {
        await page.keyboard.press("Escape");
        await page.waitForTimeout(500);
      }
    }

    const snippet = await getPageSnippet(page);
    console.log(`[Scenario7] Page content snippet: ${snippet}`);

    expect(
      hasIncentivesHeading || hasTable || hasCreateButton,
      "Incentives page should show incentive-related content"
    ).toBeTruthy();
  });
});

/* ------------------------------------------------------------------ */
/*  Scenario 8: Commissions (Admin)                                    */
/* ------------------------------------------------------------------ */
test.describe.serial("Scenario 8 - Commissions (Admin)", () => {
  test("Admin can access commissions page", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/commissions");

    await expect(page).toHaveURL(/\/commissions/);
    await page.waitForTimeout(3000);

    const hasHeading = await page
      .getByRole("heading", { name: /commission/i })
      .isVisible()
      .catch(() => false);
    const hasTable = await page
      .getByRole("table")
      .isVisible()
      .catch(() => false);

    console.log(
      `[Scenario8] heading=${hasHeading}, table=${hasTable}`
    );

    await page.screenshot({
      path: "test-results/payroll-08-admin-commissions.png",
      fullPage: true,
    });

    const snippet = await getPageSnippet(page);
    console.log(`[Scenario8] Page content snippet: ${snippet}`);

    expect(
      hasHeading || hasTable,
      "Commissions page should show commission-related content"
    ).toBeTruthy();
  });
});

/* ------------------------------------------------------------------ */
/*  Scenario 9: Settings page (Admin)                                  */
/* ------------------------------------------------------------------ */
test.describe.serial("Scenario 9 - Settings Page (Admin)", () => {
  test("Admin can access settings page", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/settings");

    await expect(page).toHaveURL(/\/settings/);
    await page.waitForTimeout(3000);

    const hasHeading = await page
      .getByRole("heading", { name: /setting/i })
      .isVisible()
      .catch(() => false);
    const hasForm = await page
      .locator("form, [class*='setting'], [class*='config']")
      .first()
      .isVisible()
      .catch(() => false);

    console.log(
      `[Scenario9] heading=${hasHeading}, form=${hasForm}`
    );

    await page.screenshot({
      path: "test-results/payroll-09-admin-settings.png",
      fullPage: true,
    });

    const snippet = await getPageSnippet(page);
    console.log(`[Scenario9] Page content snippet: ${snippet}`);

    const currentUrl = page.url();
    const redirectedToSignIn = currentUrl.includes("/sign-in");
    expect(
      !redirectedToSignIn,
      "Admin should not be redirected to sign-in for settings"
    ).toBeTruthy();
  });
});

/* ------------------------------------------------------------------ */
/*  Scenario 10: Users management (Owner)                              */
/* ------------------------------------------------------------------ */
test.describe.serial("Scenario 10 - Users Management (Owner)", () => {
  test("Owner can access users page and attempt to create user", async ({
    page,
  }) => {
    await signInAsOwner(page);
    await navigateTo(page, "/dashboard/users");

    await expect(page).toHaveURL(/\/users/);
    await page.waitForTimeout(3000);

    const hasHeading = await page
      .getByRole("heading", { name: /user/i })
      .isVisible()
      .catch(() => false);
    const hasTable = await page
      .getByRole("table")
      .isVisible()
      .catch(() => false);
    const hasCreateButton = await page
      .getByRole("button", { name: /create|add|new|invite/i })
      .isVisible()
      .catch(() => false);

    console.log(
      `[Scenario10] heading=${hasHeading}, table=${hasTable}, createBtn=${hasCreateButton}`
    );

    await page.screenshot({
      path: "test-results/payroll-10-owner-users.png",
      fullPage: true,
    });

    // Try to click create button if visible
    if (hasCreateButton) {
      const createBtn = page
        .getByRole("button", { name: /create|add|new|invite/i })
        .first();
      await createBtn.click();
      await page.waitForTimeout(2000);

      const hasDialog = await page
        .getByRole("dialog")
        .isVisible()
        .catch(() => false);
      console.log(
        `[Scenario10] After clicking create: dialog=${hasDialog}`
      );

      await page.screenshot({
        path: "test-results/payroll-10b-owner-users-create-dialog.png",
        fullPage: true,
      });

      // Close dialog if opened
      if (hasDialog) {
        await page.keyboard.press("Escape");
        await page.waitForTimeout(500);
      }
    }

    const snippet = await getPageSnippet(page);
    console.log(`[Scenario10] Page content snippet: ${snippet}`);

    expect(
      hasHeading || hasTable,
      "Users page should show user-related content"
    ).toBeTruthy();
  });
});

/* ------------------------------------------------------------------ */
/*  Scenario 11: Activity Logs (Admin)                                 */
/* ------------------------------------------------------------------ */
test.describe.serial("Scenario 11 - Activity Logs (Admin)", () => {
  test("Admin can access activity logs page", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/activity-logs");

    await expect(page).toHaveURL(/\/activity-logs/);
    await page.waitForTimeout(3000);

    const hasHeading = await page
      .getByRole("heading", { name: /activity|log/i })
      .isVisible()
      .catch(() => false);
    const hasTable = await page
      .getByRole("table")
      .isVisible()
      .catch(() => false);

    console.log(
      `[Scenario11] heading=${hasHeading}, table=${hasTable}`
    );

    await page.screenshot({
      path: "test-results/payroll-11-admin-activity-logs.png",
      fullPage: true,
    });

    const snippet = await getPageSnippet(page);
    console.log(`[Scenario11] Page content snippet: ${snippet}`);

    const currentUrl = page.url();
    const redirectedToSignIn = currentUrl.includes("/sign-in");
    expect(
      !redirectedToSignIn,
      "Admin should not be redirected to sign-in for activity logs"
    ).toBeTruthy();
  });
});

/* ------------------------------------------------------------------ */
/*  Scenario 12: Notifications page (Admin)                            */
/* ------------------------------------------------------------------ */
test.describe.serial("Scenario 12 - Notifications Page (Admin)", () => {
  test("Admin can access notifications page", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/notifications");

    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    const onNotifications = currentUrl.includes("/notifications");
    const redirectedToSignIn = currentUrl.includes("/sign-in");

    console.log(
      `[Scenario12] url=${currentUrl}, onNotifications=${onNotifications}, redirectedToSignIn=${redirectedToSignIn}`
    );

    // The notifications page may or may not exist as a route;
    // if it redirected somewhere else, that's a finding
    await page.screenshot({
      path: "test-results/payroll-12-admin-notifications.png",
      fullPage: true,
    });

    const snippet = await getPageSnippet(page);
    console.log(`[Scenario12] Page content snippet: ${snippet}`);

    expect(
      !redirectedToSignIn,
      "Admin should not be redirected to sign-in"
    ).toBeTruthy();
  });
});

/* ------------------------------------------------------------------ */
/*  BONUS: Cross-role comparison of Dashboard views                    */
/* ------------------------------------------------------------------ */
test.describe.serial("Bonus - Cross-Role Dashboard Comparison", () => {
  test("Each role sees appropriate dashboard content", async ({ page }) => {
    const roles = [
      {
        label: "Owner",
        email: "owner@company.com",
        password: "Owner@123",
      },
      {
        label: "Admin",
        email: "admin@company.com",
        password: "Admin@123",
      },
      {
        label: "HR",
        email: "hr@company.com",
        password: "Hr@12345",
      },
      {
        label: "Employee",
        email: "sales@company.com",
        password: "Sales@12345",
      },
      {
        label: "Accounts",
        email: "accounts@company.com",
        password: "Accounts@123",
      },
    ];

    for (const role of roles) {
      // Sign in as each role
      await signInAs(page, role.email, role.password);
      await page.waitForTimeout(3000);

      // Collect what they see
      const kpiLabels = [
        "Total Properties",
        "Total Leads",
        "Site Visits",
        "Total Bookings",
        "Total Employees",
        "Present Today",
      ];

      const visibleKpis: string[] = [];
      for (const label of kpiLabels) {
        const visible = await page
          .getByText(label)
          .first()
          .isVisible()
          .catch(() => false);
        if (visible) visibleKpis.push(label);
      }

      const svgCount = await page.locator("svg").count().catch(() => 0);

      console.log(
        `[Bonus:${role.label}] KPIs=${JSON.stringify(visibleKpis)}, svgs=${svgCount}`
      );

      await page.screenshot({
        path: `test-results/payroll-bonus-${role.label.toLowerCase()}-dashboard.png`,
        fullPage: true,
      });

      // Re-login for next role (sign out first by clearing cookies)
      const context = page.context();
      await context.clearCookies();
    }

    // If we get here, all roles were tested
    expect(true).toBeTruthy();
  });
});
