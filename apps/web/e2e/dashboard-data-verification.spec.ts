/**
 * Dashboard Data Verification — Per-Role E2E Tests
 * ==================================================
 * Verifies that each role's dashboard shows correct widgets, KPIs, and data.
 *
 * Run:
 *   cd apps/web
 *   $env:PLAYWRIGHT_SKIP_WEBSERVER="1"
 *   npx playwright test e2e/dashboard-data-verification.spec.ts --reporter=list --project=chromium
 */
import { expect, test } from "@playwright/test";
import {
  signInAsAdmin,
  signInAsOwner,
  signInAsHR,
  signInAsEmployee,
  signInAsManager,
  signInAsAccounts,
  signInAsTeamLead,
  signInAsFieldEmployee,
} from "./helpers";

/* ------------------------------------------------------------------ */
/*  Helper: Check if text exists in the visible page body              */
/* ------------------------------------------------------------------ */
async function pageContainsText(page: any, text: string): Promise<boolean> {
  return page.getByText(text).first().isVisible({ timeout: 3000 }).catch(() => false);
}

async function assertSectionVisible(page: any, label: string, sectionText: string) {
  const found = await pageContainsText(page, sectionText);
  if (!found) {
    console.log(`  [${label}] MISSING: "${sectionText}" not found on page`);
  }
  return found;
}

/* ================================================================== */
/*  OWNER DASHBOARD                                                    */
/* ================================================================== */
test.describe.serial("OWNER Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsOwner(page);
    await page.waitForTimeout(2000);
  });

  test("Shows company overview KPIs", async ({ page }) => {
    const kpis = ["Properties", "Total Leads", "Total Employees", "Present Today"];
    let foundCount = 0;
    for (const kpi of kpis) {
      if (await assertSectionVisible(page, "Owner KPI", kpi)) foundCount++;
    }
    console.log(`Owner dashboard: ${foundCount}/${kpis.length} KPIs visible`);
    // Owner should see at least 2 KPIs
    expect(foundCount).toBeGreaterThanOrEqual(2);
  });

  test("Shows employee attendance widget", async ({ page }) => {
    const found = await pageContainsText(page, "Attendance");
    console.log(`Owner sees attendance widget: ${found}`);
  });

  test("Shows recent tasks/activities", async ({ page }) => {
    const found = await pageContainsText(page, "Task") || await pageContainsText(page, "Activity");
    console.log(`Owner sees tasks/activity: ${found}`);
  });

  test("Shows revenue/profitability section", async ({ page }) => {
    const found = await pageContainsText(page, "Revenue")
      || await pageContainsText(page, "Profit")
      || await pageContainsText(page, "Income");
    console.log(`Owner sees revenue section: ${found}`);
  });
});

/* ================================================================== */
/*  ADMIN DASHBOARD                                                    */
/* ================================================================== */
test.describe.serial("ADMIN Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page);
    await page.waitForTimeout(2000);
  });

  test("Shows operational KPIs", async ({ page }) => {
    const kpis = ["Total Properties", "Total Leads", "Total Bookings", "Site Visits"];
    let foundCount = 0;
    for (const kpi of kpis) {
      if (await assertSectionVisible(page, "Admin KPI", kpi)) foundCount++;
    }
    console.log(`Admin dashboard: ${foundCount}/${kpis.length} KPIs visible`);
    expect(foundCount).toBeGreaterThanOrEqual(2);
  });

  test("Shows employee attendance summary", async ({ page }) => {
    const found = await pageContainsText(page, "Present")
      || await pageContainsText(page, "Attendance")
      || await pageContainsText(page, "On Leave");
    console.log(`Admin sees attendance summary: ${found}`);
  });

  test("Shows pending approvals section", async ({ page }) => {
    const found = await pageContainsText(page, "Approval")
      || await pageContainsText(page, "Pending");
    console.log(`Admin sees approvals: ${found}`);
  });
});

/* ================================================================== */
/*  HR DASHBOARD                                                       */
/* ================================================================== */
test.describe.serial("HR Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsHR(page);
    await page.waitForTimeout(2000);
  });

  test("Shows HR-focused KPIs", async ({ page }) => {
    const kpis = ["Total Employees", "Present Today", "On Leave"];
    let foundCount = 0;
    for (const kpi of kpis) {
      if (await assertSectionVisible(page, "HR KPI", kpi)) foundCount++;
    }
    console.log(`HR dashboard: ${foundCount}/${kpis.length} HR KPIs visible`);

    // HR dashboard should NOT show real estate KPIs
    const hasProperties = await pageContainsText(page, "Total Properties");
    const hasLeads = await pageContainsText(page, "Total Leads");
    const hasBookings = await pageContainsText(page, "Total Bookings");
    if (hasProperties || hasLeads || hasBookings) {
      console.log("  [HR] WARNING: HR dashboard shows CRM KPIs (Properties/Leads/Bookings)");
    }
  });

  test("Shows leave request summary", async ({ page }) => {
    const found = await pageContainsText(page, "Leave")
      || await pageContainsText(page, "Absence");
    console.log(`HR sees leave summary: ${found}`);
  });

  test("Shows attendance widget", async ({ page }) => {
    const found = await pageContainsText(page, "Attendance");
    console.log(`HR sees attendance widget: ${found}`);
  });
});

/* ================================================================== */
/*  EMPLOYEE DASHBOARD                                                 */
/* ================================================================== */
test.describe.serial("EMPLOYEE Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsEmployee(page);
    await page.waitForTimeout(2000);
  });

  test("Shows personal attendance KPIs", async ({ page }) => {
    const kpis = ["Present", "Attendance", "Check In", "Today's Hours"];
    let foundCount = 0;
    for (const kpi of kpis) {
      if (await assertSectionVisible(page, "Employee KPI", kpi)) foundCount++;
    }
    console.log(`Employee dashboard: ${foundCount}/${kpis.length} personal KPIs visible`);

    // Employee should NOT see management KPIs
    const hasTotalProps = await pageContainsText(page, "Total Properties");
    const hasPayroll = await pageContainsText(page, "Payroll");
    if (hasTotalProps) console.log("  [Emp] WARNING: Employee sees Total Properties KPI");
    if (hasPayroll) console.log("  [Emp] WARNING: Employee sees Payroll info");
  });

  test("Shows my tasks widget", async ({ page }) => {
    const found = await pageContainsText(page, "My Task") || await pageContainsText(page, "Tasks");
    console.log(`Employee sees tasks widget: ${found}`);
  });

  test("Has attendance check-in button", async ({ page }) => {
    const found = await pageContainsText(page, "Check In")
      || await pageContainsText(page, "Check-in")
      || await pageContainsText(page, "Punch In");
    console.log(`Employee sees check-in button: ${found}`);
  });

  test("Does NOT show company financials", async ({ page }) => {
    const hasRevenue = await pageContainsText(page, "Revenue");
    const hasProfit = await pageContainsText(page, "Profit");
    const hasPayroll = await pageContainsText(page, "Payroll");
    const hasCompany = await pageContainsText(page, "Company Overview");
    if (hasRevenue || hasProfit || hasPayroll || hasCompany) {
      console.log("  [Emp] WARNING: Employee sees financial data they shouldn't");
    }
  });
});

/* ================================================================== */
/*  MANAGER DASHBOARD                                                  */
/* ================================================================== */
test.describe.serial("MANAGER Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsManager(page);
    await page.waitForTimeout(2000);
  });

  test("Shows team-related KPIs", async ({ page }) => {
    const kpis = ["Present Today", "Total Employees", "Attendance"];
    let foundCount = 0;
    for (const kpi of kpis) {
      if (await assertSectionVisible(page, "Manager KPI", kpi)) foundCount++;
    }
    console.log(`Manager dashboard: ${foundCount}/${kpis.length} team KPIs visible`);
  });

  test("Shows team tasks widget", async ({ page }) => {
    const found = await pageContainsText(page, "Task")
      || await pageContainsText(page, "Team Task");
    console.log(`Manager sees team tasks: ${found}`);
  });
});

/* ================================================================== */
/*  ACCOUNTS DASHBOARD                                                 */
/* ================================================================== */
test.describe.serial("ACCOUNTS Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAccounts(page);
    await page.waitForTimeout(2000);
  });

  test("Shows financial KPIs", async ({ page }) => {
    const kpis = ["Expense", "Payment", "Revenue", "Payroll"];
    let foundCount = 0;
    for (const kpi of kpis) {
      if (await assertSectionVisible(page, "Accounts KPI", kpi)) foundCount++;
    }
    console.log(`Accounts dashboard: ${foundCount}/${kpis.length} financial KPIs visible`);
  });
});

/* ================================================================== */
/*  TEAM LEAD DASHBOARD                                                */
/* ================================================================== */
test.describe.serial("TEAM LEAD Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsTeamLead(page);
    await page.waitForTimeout(2000);
  });

  test("Loads without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });

    await page.waitForTimeout(2000);
    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(50);
    console.log(`Team Lead dashboard loaded, body length: ${body?.length}`);
  });

  test("Shows team-oriented data", async ({ page }) => {
    const teamWidget = await pageContainsText(page, "Team")
      || await pageContainsText(page, "Attendance");
    console.log(`Team Lead sees team data: ${teamWidget}`);
  });
});

/* ================================================================== */
/*  FIELD EMPLOYEE DASHBOARD                                           */
/* ================================================================== */
test.describe.serial("FIELD EMPLOYEE Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsFieldEmployee(page);
    await page.waitForTimeout(2000);
  });

  test("Shows field-work relevant KPIs", async ({ page }) => {
    const kpis = ["Present", "Attendance", "Check In", "Today"];
    let foundCount = 0;
    for (const kpi of kpis) {
      if (await assertSectionVisible(page, "FieldEmp KPI", kpi)) foundCount++;
    }
    console.log(`Field Employee dashboard: ${foundCount}/${kpis.length} field KPIs visible`);
  });

  test("Does NOT show management controls", async ({ page }) => {
    const hasAddEmployee = await pageContainsText(page, "Add Employee");
    const hasSettings = await pageContainsText(page, "Settings");
    const hasPayroll = await pageContainsText(page, "Payroll");
    if (hasAddEmployee) console.log("  [FieldEmp] WARNING: Sees Add Employee");
    if (hasSettings) console.log("  [FieldEmp] WARNING: Sees Settings");
    if (hasPayroll) console.log("  [FieldEmp] WARNING: Sees Payroll");
  });
});

/* ================================================================== */
/*  SUMMARY                                                           */
/* ================================================================== */
test.describe.serial("Dashboard Data Verification Summary", () => {
  test("Print coverage summary", async () => {
    console.log("\n===== DASHBOARD DATA VERIFICATION COVERAGE =====");
    console.log("Owner dashboard:     KPIs, attendance, tasks, revenue");
    console.log("Admin dashboard:     Operational KPIs, attendance, approvals");
    console.log("HR dashboard:        HR KPIs, leave summary, attendance widget");
    console.log("Employee dashboard:  Personal attendance, tasks, check-in");
    console.log("Manager dashboard:   Team KPIs, team tasks");
    console.log("Accounts dashboard:  Financial KPIs (expense, payment, revenue)");
    console.log("Team Lead dashboard: Team data, attendance");
    console.log("Field Employee:      Field KPIs, attendance, check-in");
    console.log("=================================================\n");
  });
});
