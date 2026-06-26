import { expect, test, request } from "@playwright/test";
import { signInAsAdmin, signInAsOwner, signInAsHR, signInAsEmployee, navigateTo } from "./helpers";

const API_URL = process.env.API_URL || "http://127.0.0.1:4000";

test.describe("Phase 1 — Owner Foundation", () => {
  test("OWNER can log in and see dashboard", async ({ page }) => {
    await signInAsOwner(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("Approvals page accessible to OWNER", async ({ page }) => {
    await signInAsOwner(page);
    await navigateTo(page, "/dashboard/approvals");
    await expect(page).toHaveURL(/\/approvals/);
  });

  test("Settings page accessible to ADMIN", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/settings");
    await expect(page).toHaveURL(/\/settings/);
  });
});

test.describe("Phase 2 — Permission Grants", () => {
  test("Permissions page accessible to OWNER", async ({ page }) => {
    await signInAsOwner(page);
    await navigateTo(page, "/dashboard/permissions");
    await expect(page).toHaveURL(/\/permissions/);
  });
});

test.describe("Phase 3 — Accounts & Payments", () => {
  test("Payments page loads", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/payments");
    await expect(page).toHaveURL(/\/payments/);
  });

  test("Expenses page loads", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/expenses");
    await expect(page).toHaveURL(/\/expenses/);
  });
});

test.describe("Phase 4 — EOD & Escalation", () => {
  test("EOD Reports page loads", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/eod-reports");
    await expect(page).toHaveURL(/\/eod-reports/);
  });

  test("Escalation page loads", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/escalation");
    await expect(page).toHaveURL(/\/escalation/);
  });
});

test.describe("Phase 5 — Attendance Hardening", () => {
  test("Attendance page loads", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/attendance");
    await expect(page).toHaveURL(/\/attendance$/);
  });

  test("Attendance corrections page loads", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/attendance-corrections");
    await expect(page).toHaveURL(/\/attendance-corrections/);
  });

  test("Devices page loads", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/devices");
    await expect(page).toHaveURL(/\/devices/);
  });
});

test.describe("Phase 6 — Payroll", () => {
  test("Payroll page loads", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/payroll");
    await expect(page).toHaveURL(/\/payroll/);
  });
});

test.describe("Phase 7 — Construction ERP", () => {
  test("Construction sites page loads", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/construction-sites");
    await expect(page).toHaveURL(/\/construction-sites/);
  });

  test("Vendors page loads", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/vendors");
    await expect(page).toHaveURL(/\/vendors/);
  });

  test("Materials page loads", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/materials");
    await expect(page).toHaveURL(/\/materials/);
  });

  test("Inventory page loads", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/inventory");
    await expect(page).toHaveURL(/\/inventory/);
  });

  test("Labour page loads", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/labour");
    await expect(page).toHaveURL(/\/labour/);
  });
});

test.describe("Phase 8 — External Portals", () => {
  test("Brokers page loads", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/brokers");
    await expect(page).toHaveURL(/\/brokers/);
  });

  test("Complaints page loads", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/complaints");
    await expect(page).toHaveURL(/\/complaints/);
  });
});

test.describe("Phase 9 — Security Hardening", () => {
  test("Activity logs page loads", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/activity-logs");
    await expect(page).toHaveURL(/\/activity-logs/);
  });
});

test.describe("Phase 10 — Commissions & Incentives", () => {
  test("Commissions page loads", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/commissions");
    await expect(page).toHaveURL(/\/commissions/);
  });

  test("Incentives page loads", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/incentives");
    await expect(page).toHaveURL(/\/incentives/);
  });
});

test.describe("Core CRM Pages", () => {
  test("Properties page loads", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/properties");
    await expect(page).toHaveURL(/\/properties/);
  });

  test("Leads page loads", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/leads");
    await expect(page).toHaveURL(/\/leads/);
  });

  test("Customers page loads", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/customers");
    await expect(page).toHaveURL(/\/customers/);
  });

  test("Bookings page loads", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/bookings");
    await expect(page).toHaveURL(/\/bookings/);
  });
});

test.describe("HRMS Pages", () => {
  test("Employees page loads", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/employees");
    await expect(page).toHaveURL(/\/employees/);
  });

  test("Departments page loads", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/departments");
    await expect(page).toHaveURL(/\/departments/);
  });

  test("Leave requests page loads", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/leave-requests");
    await expect(page).toHaveURL(/\/leave-requests/);
  });
});

test.describe("Auth & Access Control", () => {
  test("unauthenticated user redirected to sign-in", async ({ page }) => {
    await page.goto("/dashboard/properties");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("invalid credentials rejected", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByLabel("Email")).toBeVisible();

    const csrfReq = await page.request.get("/api/auth/csrf");
    const { csrfToken } = await csrfReq.json();

    const resp = await page.request.post("/api/auth/callback/credentials", {
      headers: { "X-Auth-Return-Redirect": "1" },
      form: { csrfToken, email: "admin@company.com", password: "wrongpass", callbackUrl: "/dashboard" },
    });

    const body = await resp.json();
    expect(resp.ok()).toBeTruthy();
    expect(body.url).toBeDefined();
    expect(body.url).toContain("error");
  });

  // Note: API-level RBAC enforced via @Roles guard on write endpoints, not on GET reads

  test("API health endpoint is public", async () => {
    const ctx = await request.newContext({ baseURL: API_URL });
    const resp = await ctx.get("/api/health");
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body.status).toBe("ok");
  });
});

test.describe("Sign Out Flow", () => {
  test("sign out clears session", async ({ page }) => {
    await signInAsAdmin(page);

    // Sign out via UI menu
    await page.getByRole("button", { name: /Admin User/i }).click();
    await page.getByRole("menuitem", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
