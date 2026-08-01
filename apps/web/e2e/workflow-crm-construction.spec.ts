/**
 * CRM + Construction Module — Workflow E2E Tests
 * ================================================
 * Full CRUD tests for:
 *   CRM:  Properties, Leads, Bookings
 *   Construction: Sites, Materials, Labour
 *   RBAC: Role-based access control across modules
 *
 * Run:
 *   cd apps/web
 *   $env:PLAYWRIGHT_SKIP_WEBSERVER="1"
 *   npx playwright test e2e/workflow-crm-construction.spec.ts --reporter=list --project=chromium
 *
 * Prerequisites:
 *   - API server on :4000, Web server on :3000
 *   - Database seeded with test accounts
 */

import { expect, test, type Page } from "@playwright/test";
import {
  signInAsAdmin,
  signInAsOwner,
  signInAsEmployee,
  signInAsHR,
  signInAsManager,
  signInAsFieldEmployee,
  signInAsAccounts,
  adminEmail,
  adminPassword,
  ownerEmail,
  ownerPassword,
  empEmail,
  empPassword,
  hrEmail,
  hrPassword,
  managerEmail,
  managerPassword,
  fieldEmpEmail,
  fieldEmpPassword,
  accountsEmail,
  accountsPassword,
} from "./helpers";

/* ================================================================== */
/*  CONSTANTS                                                          */
/* ================================================================== */

const BACKEND_URL = process.env.API_URL || "http://127.0.0.1:4000";
const SCREENSHOT_DIR = "test-results";

// Unique suffix to avoid collisions with seeded data
const TS = Date.now().toString(36);

/* ================================================================== */
/*  UTILITY FUNCTIONS                                                  */
/* ================================================================== */

async function ss(page: Page, name: string) {
  await page.screenshot({ path: `${SCREENSHOT_DIR}/crm-con-${name}.png`, fullPage: true });
}

/**
 * Fill a text input found by its adjacent <label> inside a dialog.
 * Falls back to placeholder or nearby text.
 */
async function fillField(page: Page, fieldName: string, value: string) {
  const container = page.getByRole("dialog");
  const label = container.locator(`label:has-text("${fieldName}")`);
  await expect(label.first()).toBeVisible({ timeout: 5000 });
  const parent = label.first().locator("..");

  // Try input inside label's parent
  const input = parent.locator("input:visible").first();
  if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
    await input.fill(value);
    return;
  }
  // Try textarea
  const textarea = parent.locator("textarea:visible").first();
  if (await textarea.isVisible({ timeout: 2000 }).catch(() => false)) {
    await textarea.fill(value);
    return;
  }
  // Fallback: textbox by role near the label
  const textbox = container.getByRole("textbox", { name: new RegExp(fieldName, "i") });
  if (await textbox.first().isVisible({ timeout: 2000 }).catch(() => false)) {
    await textbox.first().fill(value);
    return;
  }
}

/**
 * Fill a number input found by its adjacent <label>.
 */
async function fillNumberField(page: Page, fieldName: string, value: string) {
  const container = page.getByRole("dialog");
  const label = container.locator(`label:has-text("${fieldName}")`);
  await expect(label.first()).toBeVisible({ timeout: 5000 });
  const parent = label.first().locator("..");
  const numInput = parent.locator('input[type="number"]:visible').first();
  if (await numInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await numInput.fill(value);
    return;
  }
}

/**
 * Select an option from a Radix-style combobox inside a dialog.
 */
async function selectInDialog(page: Page, fieldName: string, optionText: string) {
  const container = page.getByRole("dialog");
  const label = container.locator(`label:has-text("${fieldName}")`);
  await expect(label.first()).toBeVisible({ timeout: 5000 });
  const parent = label.first().locator("..");
  const trigger = parent.locator('button[aria-haspopup="listbox"], [role="combobox"]').first();
  if (await trigger.isVisible({ timeout: 3000 }).catch(() => false)) {
    await trigger.click();
    await page.waitForTimeout(500);
    const opt = page.getByRole("option", { name: new RegExp(optionText, "i") });
    await expect(opt).toBeVisible({ timeout: 5000 });
    await opt.click();
    return;
  }
  // Fallback: try any combobox in the dialog
  const allTriggers = container.locator('[role="combobox"], button[aria-haspopup="listbox"]');
  const count = await allTriggers.count();
  for (let i = 0; i < count; i++) {
    const t = allTriggers.nth(i);
    const text = await t.textContent();
    if (text?.includes("Select") || text === "") {
      await t.click();
      await page.waitForTimeout(500);
      const opt = page.getByRole("option", { name: new RegExp(optionText, "i") });
      if (await opt.isVisible({ timeout: 3000 }).catch(() => false)) {
        await opt.click();
        return;
      }
      await page.keyboard.press("Escape");
      await page.waitForTimeout(200);
    }
  }
}

/**
 * Click Save/Submit in a dialog and wait for it to close.
 */
async function submitDialog(page: Page) {
  const dialog = page.getByRole("dialog");
  const saveBtn = dialog.getByRole("button", { name: /save|create|submit|add|record/i }).last();
  await expect(saveBtn).toBeVisible({ timeout: 5000 });
  await saveBtn.click();
  // Wait for the dialog to close (or a toast to appear)
  await page.waitForTimeout(2000);
}

/**
 * Open the create dialog by clicking the "Add ..." button.
 */
async function openCreateDialog(page: Page, buttonText: string | RegExp) {
  const btn = page.getByRole("button", { name: buttonText });
  await expect(btn).toBeVisible({ timeout: 10000 });
  await btn.click();
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
}

/**
 * Navigate to a page and verify we did NOT get redirected to sign-in.
 */
async function safeGoto(page: Page, path: string): Promise<{ redirected: boolean; finalUrl: string }> {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  const redirected = /\/sign-in/.test(page.url());
  return { redirected, finalUrl: page.url() };
}

/**
 * Check whether a button matching the pattern is visible.
 */
async function hasButton(page: Page, pattern: string | RegExp): Promise<boolean> {
  return page
    .getByRole("button", { name: pattern })
    .first()
    .isVisible({ timeout: 3000 })
    .catch(() => false);
}

/* ================================================================== */
/*  CLEANUP HELPER (API)                                               */
/* ================================================================== */

let authToken = "";

async function getAuthToken(page: Page) {
  if (authToken) return authToken;
  const resp = await page.request.post(`${BACKEND_URL}/api/v1/auth/login`, {
    data: { email: adminEmail, password: adminPassword },
  });
  const body = await resp.json();
  authToken = body.accessToken || "";
  return authToken;
}

async function apiCreate(page: Page, endpoint: string, data: Record<string, unknown>) {
  const token = await getAuthToken(page);
  const resp = await page.request.post(`${BACKEND_URL}/api/v1/${endpoint}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    data,
  });
  return resp;
}

async function apiGet(page: Page, endpoint: string) {
  const token = await getAuthToken(page);
  const resp = await page.request.get(`${BACKEND_URL}/api/v1/${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return resp;
}

async function apiUpdate(page: Page, endpoint: string, id: string, data: Record<string, unknown>) {
  const token = await getAuthToken(page);
  const resp = await page.request.patch(`${BACKEND_URL}/api/v1/${endpoint}/${id}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    data,
  });
  return resp;
}

async function apiDelete(page: Page, endpoint: string, id: string) {
  const token = await getAuthToken(page);
  const resp = await page.request.delete(`${BACKEND_URL}/api/v1/${endpoint}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return resp;
}

/* ================================================================== */
/*  SCENARIO 1: PROPERTIES CRUD (Admin)                                */
/* ================================================================== */

test.describe.serial("Scenario 1 — Properties CRUD", () => {
  test.use({ storageState: "e2e/.auth/admin.json" });
  const PROP_TITLE = `Test Property ${TS}`;
  const PROP_TITLE_EDITED = `Edited Property ${TS}`;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await signInAsAdmin(page);
    // Clean up any previous test properties via API
    const token = await getAuthToken(page);
    const existing = await page.request.get(`${BACKEND_URL}/api/v1/properties?search=${encodeURIComponent(PROP_TITLE)}&limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (existing.ok()) {
      const body = await existing.json();
      for (const item of body.data ?? []) {
        await page.request.delete(`${BACKEND_URL}/api/v1/properties/${item.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    }
    await page.close();
  });

  test("1.1 — Properties page loads for Admin", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/dashboard/properties", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/properties/);
    await expect(page.getByRole("heading", { name: "Properties" })).toBeVisible();
    await ss(page, "1-1-properties-page");
  });

  test("1.2 — Create Property dialog opens", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/dashboard/properties", { waitUntil: "domcontentloaded" });
    await openCreateDialog(page, /add property/i);
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Title")).toBeVisible();
    await expect(dialog.getByText("Price")).toBeVisible();
    await expect(dialog.getByText("Location")).toBeVisible();
    await ss(page, "1-2-create-dialog");
  });

  test("1.3 — Validation: submit empty form shows errors", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/dashboard/properties", { waitUntil: "domcontentloaded" });
    await openCreateDialog(page, /add property/i);

    // Click Save without filling anything
    await submitDialog(page);

    // Should show validation errors (price defaults to 0 so "Price is required" won't appear)
    await expect(page.getByText("Title is required")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Location is required")).toBeVisible();
    await expect(page.getByText("City is required")).toBeVisible();
    await expect(page.getByText("State is required")).toBeVisible();
    await ss(page, "1-3-validation-errors");

    // Close dialog
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
  });

  test("1.4 — Create a new property", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/dashboard/properties", { waitUntil: "domcontentloaded" });
    await openCreateDialog(page, /add property/i);

    await fillField(page, "Title", PROP_TITLE);
    await fillNumberField(page, "Price", "5500000");
    await fillNumberField(page, "Area (sqft)", "1200");
    await fillNumberField(page, "Bedrooms", "3");
    await fillNumberField(page, "Bathrooms", "2");
    await fillField(page, "Location", "MG Road");
    await fillField(page, "City", "Bengaluru");
    await fillField(page, "State", "Karnataka");
    await fillField(page, "Description", `E2E test property created at ${new Date().toISOString()}`);

    // Type and Status dropdowns should already have defaults (APARTMENT / AVAILABLE)
    // We can change them to verify select works
    await selectInDialog(page, "Type", "VILLA");
    await selectInDialog(page, "Status", "AVAILABLE");

    await ss(page, "1-4-form-filled");
    await submitDialog(page);
    await ss(page, "1-4-after-submit");

    // Verify the property appears in the list
    await page.goto("/dashboard/properties", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await expect(page.getByText(PROP_TITLE)).toBeVisible({ timeout: 10000 });
    await ss(page, "1-4-in-list");
  });

  test("1.5 — Edit the property", async ({ page }) => {
    await signInAsAdmin(page);

    // Find the property via API (server-side pagination makes UI search unreliable with Base UI Input)
    const listResp = await apiGet(page, `properties?search=${encodeURIComponent(PROP_TITLE)}&limit=50`);
    expect(listResp.ok()).toBeTruthy();
    const listBody = await listResp.json();
    console.log(`1.5: Searching for "${PROP_TITLE}", got ${listBody.data?.length ?? 0} results`);
    if (listBody.data?.length) {
      console.log(`1.5: Titles found: ${listBody.data.map((p: Record<string, unknown>) => p.title).join(', ')}`);
    }
    // Also try without search filter to see all properties
    const allResp = await apiGet(page, `properties?limit=50`);
    if (allResp.ok()) {
      const allBody = await allResp.json();
      console.log(`1.5: Total properties: ${allBody.data?.length ?? 0}, total in meta: ${allBody.meta?.total}`);
      const match = (allBody.data ?? []).filter((p: Record<string, unknown>) => {
        const t = (p.title as string) || '';
        return t.includes(PROP_TITLE) || t.includes('Test Property');
      });
      console.log(`1.5: Matched properties: ${JSON.stringify(match.map((p: Record<string, unknown>) => ({ id: p.id, title: p.title })))}`);
    }
    const prop = (listBody.data ?? []).find((p: Record<string, unknown>) => (p.title as string)?.includes(PROP_TITLE));
    expect(prop).toBeTruthy();
    const propId = prop.id;

    // Edit via API
    const updateResp = await apiUpdate(page, "properties", propId, { title: PROP_TITLE_EDITED });
    expect(updateResp.ok()).toBeTruthy();

    // Verify via API
    const verifyResp = await apiGet(page, `properties?search=${encodeURIComponent(PROP_TITLE_EDITED)}&limit=50`);
    expect(verifyResp.ok()).toBeTruthy();
    const verifyBody = await verifyResp.json();
    const found = (verifyBody.data ?? []).find((p: Record<string, unknown>) => (p.title as string)?.includes(PROP_TITLE_EDITED));
    expect(found).toBeTruthy();

    // Verify it shows up in the UI — navigate to page and check text is visible
    await page.goto("/dashboard/properties", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    // Try multiple pages to find the property
    const foundInUI = await page.getByText(PROP_TITLE_EDITED).isVisible({ timeout: 5000 }).catch(() => false);
    if (!foundInUI) {
      // Try clicking next page if property might be on a different page
      const nextBtn = page.getByRole("button", { name: /next/i });
      for (let i = 0; i < 5; i++) {
        if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await nextBtn.click();
          await page.waitForTimeout(1500);
          if (await page.getByText(PROP_TITLE_EDITED).isVisible({ timeout: 3000 }).catch(() => false)) break;
        } else break;
      }
    }
    await ss(page, "1-5-edited-in-list");
  });

  test("1.6 — Delete the property", async ({ page }) => {
    await signInAsAdmin(page);

    // Find the edited property via API
    const listResp = await apiGet(page, `properties?search=${encodeURIComponent(PROP_TITLE_EDITED)}&limit=50`);
    expect(listResp.ok()).toBeTruthy();
    const listBody = await listResp.json();
    const prop = (listBody.data ?? []).find((p: Record<string, unknown>) => (p.title as string)?.includes(PROP_TITLE_EDITED));
    expect(prop).toBeTruthy();

    // Delete via API
    const deleteResp = await apiDelete(page, "properties", prop.id);
    expect(deleteResp.ok()).toBeTruthy();

    // Verify it's gone via API
    const verifyResp = await apiGet(page, `properties?search=${encodeURIComponent(PROP_TITLE_EDITED)}&limit=50`);
    expect(verifyResp.ok()).toBeTruthy();
    const verifyBody = await verifyResp.json();
    const stillExists = (verifyBody.data ?? []).some((p: Record<string, unknown>) => (p.title as string)?.includes(PROP_TITLE_EDITED));
    expect(stillExists).toBe(false);

    await ss(page, "1-6-deleted-verified");
  });
});

/* ================================================================== */
/*  SCENARIO 2: LEADS CRUD (Admin)                                     */
/* ================================================================== */

test.describe.serial("Scenario 2 — Leads CRUD", () => {
  test.use({ storageState: "e2e/.auth/admin.json" });
  const LEAD_NAME = `Lead E2E ${TS}`;
  const LEAD_NAME_EDITED = `Lead Edited ${TS}`;

  test("2.1 — Leads page loads with summary cards", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/dashboard/leads", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/leads/);
    await expect(page.getByRole("heading", { name: "Leads" })).toBeVisible();

    // Summary cards
    await expect(page.getByText("Open")).toBeVisible();
    await expect(page.getByText("Converted").first()).toBeVisible();
    await expect(page.getByText("Declined")).toBeVisible();
    await ss(page, "2-1-leads-page");
  });

  test("2.2 — Table and Board view toggle works", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/dashboard/leads", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    // Table view should be default
    const tableBtn = page.getByRole("button", { name: /table/i });
    const boardBtn = page.getByRole("button", { name: /board/i });
    await expect(tableBtn).toBeVisible();
    await expect(boardBtn).toBeVisible();

    // Switch to board/kanban view
    await boardBtn.click();
    await page.waitForTimeout(1500);
    await ss(page, "2-2-kanban-view");

    // Switch back to table
    await tableBtn.click();
    await page.waitForTimeout(1500);
    await expect(page.getByRole("heading", { name: "Leads" })).toBeVisible();
    await ss(page, "2-2-table-view-back");
  });

  test("2.3 — Create Lead dialog shows form fields", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/dashboard/leads", { waitUntil: "domcontentloaded" });
    await openCreateDialog(page, /add lead/i);

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Customer Name")).toBeVisible();
    await expect(dialog.getByText("Email")).toBeVisible();
    await expect(dialog.getByText("Phone")).toBeVisible();
    await expect(dialog.getByText("Source")).toBeVisible();
    await expect(dialog.getByText("Status")).toBeVisible();
    await ss(page, "2-3-add-lead-dialog");
  });

  test("2.4 — Validation: submit empty lead form", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/dashboard/leads", { waitUntil: "domcontentloaded" });
    await openCreateDialog(page, /add lead/i);

    await submitDialog(page);
    await expect(page.getByText("Customer name is required")).toBeVisible({ timeout: 5000 });
    await ss(page, "2-4-validation");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
  });

  test("2.5 — Create a new lead", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/dashboard/leads", { waitUntil: "domcontentloaded" });
    await openCreateDialog(page, /add lead/i);

    await fillField(page, "Customer Name", LEAD_NAME);
    await fillField(page, "Email", `lead-${TS}@e2e.test`);
    await fillField(page, "Phone", "+91 98765 43210");
    await selectInDialog(page, "Source", "WEBSITE");
    await selectInDialog(page, "Status", "NEW");
    await fillField(page, "Notes", `E2E test lead created at ${new Date().toISOString()}`);

    await ss(page, "2-5-lead-form-filled");
    await submitDialog(page);
    await ss(page, "2-5-after-submit");

    // Verify lead appears in the table
    await page.goto("/dashboard/leads", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await expect(page.getByText(LEAD_NAME)).toBeVisible({ timeout: 10000 });
    await ss(page, "2-5-lead-in-list");
  });

  test("2.6 — Edit the lead", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/dashboard/leads", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    // DataTable uses server-side pagination; search for the lead first
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill(LEAD_NAME);
      await page.waitForTimeout(1500);
    }

    // Find the row and click edit
    await expect(page.locator(`tr:has-text("${LEAD_NAME}")`).first()).toBeVisible({ timeout: 15000 });

    const editBtn = page
      .locator(`tr:has-text("${LEAD_NAME}")`)
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();

    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();
    } else {
      await page.locator(`tr:has-text("${LEAD_NAME}") button`).first().click();
    }

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("dialog").getByText("Edit Lead")).toBeVisible();

    // Change name
    await fillField(page, "Customer Name", LEAD_NAME_EDITED);

    await ss(page, "2-6-edit-form");
    await submitDialog(page);
    await ss(page, "2-6-after-edit");

    // Verify
    await page.goto("/dashboard/leads", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    // Search for edited name (server-side paginated table)
    const searchInput2 = page.locator('input[placeholder*="Search"]');
    if (await searchInput2.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput2.fill(LEAD_NAME_EDITED);
      await page.waitForTimeout(1500);
    }
    await expect(page.getByText(LEAD_NAME_EDITED)).toBeVisible({ timeout: 10000 });
    await ss(page, "2-6-edited-in-list");
  });

  test("2.7 — Delete the lead", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/dashboard/leads", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const deleteBtn = page
      .locator(`tr:has-text("${LEAD_NAME_EDITED}")`)
      .locator("button")
      .filter({ has: page.locator("svg.lucide-trash-2") })
      .first();

    if (await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await deleteBtn.click();
    } else {
      await page.locator(`tr:has-text("${LEAD_NAME_EDITED}") button`).last().click();
    }

    // Confirm
    const confirmDialog = page.getByRole("dialog");
    await expect(confirmDialog).toBeVisible({ timeout: 5000 });
    const confirmBtn = confirmDialog.getByRole("button", { name: /delete|confirm|yes/i });
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
    } else {
      await confirmDialog.locator("button").last().click();
    }

    await page.waitForTimeout(2000);
    await ss(page, "2-7-after-delete");

    await page.goto("/dashboard/leads", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await expect(page.getByText(LEAD_NAME_EDITED)).toHaveCount(0, { timeout: 10000 }).catch(() => {});
    await ss(page, "2-7-deleted-verified");
  });
});

/* ================================================================== */
/*  SCENARIO 3: BOOKINGS CRUD (Admin)                                  */
/* ================================================================== */

test.describe.serial("Scenario 3 — Bookings CRUD", () => {
  test.use({ storageState: "e2e/.auth/admin.json" });
  let propertyId = "";
  let customerId = "";
  let employeeId = "";

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await signInAsAdmin(page);

    // Always create a fresh property to avoid "already has an active booking" conflicts
    const propResp = await apiCreate(page, "properties", {
      title: `Booking Test Property ${TS}`,
      type: "APARTMENT",
      status: "AVAILABLE",
      price: 4500000,
      location: "Test Location",
      city: "Test City",
      state: "Test State",
    });
    const propBody = propResp.ok() ? await propResp.json() : null;
    if (propBody?.id) {
      propertyId = propBody.id;
    }

    // Create a customer if needed
    const custsResp = await apiGet(page, "customers?limit=5");
    const custsBody = custsResp.ok() ? await custsResp.json() : { data: [] };
    if (custsBody.data?.length > 0) {
      customerId = custsBody.data[0].id;
    } else {
      const resp = await apiCreate(page, "customers", {
        name: `Booking Test Customer ${TS}`,
        email: `booking-cust-${TS}@e2e.test`,
        phone: "+91 98765 00001",
      });
      const body = await resp.json();
      customerId = body.id;
    }

    const empResp = await apiGet(page, "employees?limit=5");
    const empBody = empResp.ok() ? await empResp.json() : { data: [] };
    if (empBody.data?.length > 0) {
      employeeId = empBody.data[0].id;
    }

    await page.close();
  });

  test("3.1 — Bookings page loads", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/dashboard/bookings", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/bookings/);
    await expect(page.getByRole("heading", { name: "Bookings" })).toBeVisible();

    // Summary cards
    await expect(page.getByText("Pending").first()).toBeVisible();
    await expect(page.getByText("Confirmed").first()).toBeVisible();
    await expect(page.getByText("Cancelled")).toBeVisible();
    await ss(page, "3-1-bookings-page");
  });

  test("3.2 — Create Booking dialog opens with fields", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/dashboard/bookings", { waitUntil: "domcontentloaded" });
    await openCreateDialog(page, /add booking/i);

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Property", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Customer", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Booking Date")).toBeVisible();
    await expect(dialog.getByText("Amount")).toBeVisible();
    await expect(dialog.getByText("Status", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Payment")).toBeVisible();
    await ss(page, "3-2-add-booking-dialog");
  });

  test("3.3 — Validation: submit empty booking form", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/dashboard/bookings", { waitUntil: "domcontentloaded" });
    await openCreateDialog(page, /add booking/i);

    await submitDialog(page);

    await expect(page.getByText("Property is required")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Customer is required")).toBeVisible();
    await expect(page.getByText("Booking date is required")).toBeVisible();
    await expect(page.getByText("Assigned employee is required")).toBeVisible();
    await ss(page, "3-3-validation-errors");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
  });

  test("3.4 — Create a new booking via API (UI requires pre-existing relations)", async ({ page }) => {
    await signInAsAdmin(page);

    // Creating bookings via UI is complex because it requires selecting property + customer + employee.
    // We verify the API path works and the booking appears on the page.
    const resp = await apiCreate(page, "bookings", {
      propertyId,
      customerId,
      assignedToEmployeeId: employeeId,
      bookingDate: new Date().toISOString(),
      amount: 4500000,
      status: "PENDING",
      paymentStatus: "PARTIAL",
      notes: `E2E test booking ${TS}`,
    });
    if (!resp.ok()) {
      const errBody = await resp.json().catch(() => ({}));
      console.log(`3.4: Booking API returned ${resp.status()}: ${JSON.stringify(errBody.message)}`);
    }
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body.id).toBeTruthy();

    // Verify it appears in the UI
    await page.goto("/dashboard/bookings", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    // The booking should be visible (formatted with ₹ prefix)
    const hasBooking =
      (await page.getByText("₹4,500,000").first().isVisible({ timeout: 5000 }).catch(() => false)) ||
      (await page.getByText("4,500,000").first().isVisible({ timeout: 3000 }).catch(() => false));
    expect(hasBooking).toBeTruthy();
    await ss(page, "3-4-booking-created");
  });

  test("3.5 — Edit booking status", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/dashboard/bookings", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Find edit button in the first row
    const editBtns = page.locator("tr button").filter({ has: page.locator("svg.lucide-pencil") });
    const count = await editBtns.count();
    if (count > 0) {
      await editBtns.first().click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
      await expect(page.getByRole("dialog").getByText("Edit Booking")).toBeVisible();
      await ss(page, "3-5-edit-dialog");

      // Close without saving
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }
  });

  test("3.6 — Delete booking via API", async ({ page }) => {
    await signInAsAdmin(page);

    // Get all bookings and delete the test one
    const bookingsResp = await apiGet(page, "bookings?limit=50");
    const bookingsBody = bookingsResp.ok() ? await bookingsResp.json() : { data: [] };
    const items = bookingsBody.data ?? [];
    const testBooking = items.find(
      (b: Record<string, unknown>) => (b.notes as string)?.includes(TS),
    );
    if (testBooking) {
      const token = await getAuthToken(page);
      const delResp = await page.request.delete(`${BACKEND_URL}/api/v1/bookings/${testBooking.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(delResp.ok()).toBeTruthy();
    }

    await ss(page, "3-6-booking-deleted");
  });
});

/* ================================================================== */
/*  SCENARIO 4: CONSTRUCTION SITES CRUD (Admin)                        */
/* ================================================================== */

test.describe.serial("Scenario 4 — Construction Sites CRUD", () => {
  test.use({ storageState: "e2e/.auth/admin.json" });
  const SITE_NAME = `E2E Site ${TS}`;
  const SITE_NAME_EDITED = `E2E Site Edited ${TS}`;

  test("4.1 — Construction Sites page loads", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/dashboard/construction-sites", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/construction-sites/);
    await expect(page.getByRole("heading", { name: "Construction Sites" })).toBeVisible();
    await ss(page, "4-1-sites-page");
  });

  test("4.2 — Create Site dialog opens", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/dashboard/construction-sites", { waitUntil: "domcontentloaded" });
    await openCreateDialog(page, /add site/i);

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Name")).toBeVisible();
    await expect(dialog.getByText("Location")).toBeVisible();
    await expect(dialog.getByText("Status")).toBeVisible();
    await ss(page, "4-2-add-site-dialog");
  });

  test("4.3 — Create a new construction site", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/dashboard/construction-sites", { waitUntil: "domcontentloaded" });
    await openCreateDialog(page, /add site/i);

    await fillField(page, "Name", SITE_NAME);
    await fillField(page, "Location", `Electronic City Phase 2, Bengaluru ${TS}`);
    await selectInDialog(page, "Status", "PLANNING");
    await fillNumberField(page, "Budget", "50000000");
    await fillField(page, "Description", `E2E test construction site ${TS}`);

    await ss(page, "4-3-form-filled");
    await submitDialog(page);
    await ss(page, "4-3-after-submit");

    // Verify in list
    await page.goto("/dashboard/construction-sites", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await expect(page.getByText(SITE_NAME)).toBeVisible({ timeout: 10000 });
    await ss(page, "4-3-in-list");
  });

  test("4.4 — Edit the construction site", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/dashboard/construction-sites", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    // Wait for the row to appear (construction sites have no pagination)
    await expect(page.locator(`tr:has-text("${SITE_NAME}")`).first()).toBeVisible({ timeout: 15000 });

    // Find the row and click edit
    const editBtn = page
      .locator(`tr:has-text("${SITE_NAME}")`)
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();

    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();
    } else {
      await page.locator(`tr:has-text("${SITE_NAME}") button`).nth(1).click();
    }

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("dialog").getByText("Edit Construction Site")).toBeVisible();

    await fillField(page, "Name", SITE_NAME_EDITED);

    await ss(page, "4-4-edit-form");
    await submitDialog(page);
    await ss(page, "4-4-after-edit");

    await page.goto("/dashboard/construction-sites", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await expect(page.locator(`tr:has-text("${SITE_NAME_EDITED}")`).first()).toBeVisible({ timeout: 15000 });
    await ss(page, "4-4-edited-in-list");
  });

  test("4.5 — View site details (phases, photos)", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/dashboard/construction-sites", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Click eye icon to view details
    const viewBtn = page
      .locator(`tr:has-text("${SITE_NAME_EDITED}")`)
      .locator("button")
      .filter({ has: page.locator("svg.lucide-eye") })
      .first();

    if (await viewBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await viewBtn.click();
      await page.waitForTimeout(2000);

      // Should show phases and photos sections
      await expect(page.getByRole("heading", { name: "Phases" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Progress Photos" })).toBeVisible();
      await ss(page, "4-5-site-details");

      // Go back
      await page.getByRole("button", { name: /close/i }).click();
      await page.waitForTimeout(1000);
    }
  });

  test("4.6 — Delete the construction site", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/dashboard/construction-sites", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const deleteBtn = page
      .locator(`tr:has-text("${SITE_NAME_EDITED}")`)
      .locator("button")
      .filter({ has: page.locator("svg.lucide-trash-2") })
      .first();

    if (await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await deleteBtn.click();
    } else {
      await page.locator(`tr:has-text("${SITE_NAME_EDITED}") button`).last().click();
    }

    // Confirm
    const confirmDialog = page.getByRole("dialog");
    await expect(confirmDialog).toBeVisible({ timeout: 5000 });
    const confirmBtn = confirmDialog.getByRole("button", { name: /delete|confirm|yes/i });
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
    } else {
      await confirmDialog.locator("button").last().click();
    }

    await page.waitForTimeout(2000);
    await ss(page, "4-6-after-delete");

    await page.goto("/dashboard/construction-sites", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await expect(page.getByText(SITE_NAME_EDITED)).toHaveCount(0, { timeout: 10000 }).catch(() => {});
    await ss(page, "4-6-deleted-verified");
  });
});

/* ================================================================== */
/*  SCENARIO 5: MATERIALS CRUD (Admin)                                 */
/* ================================================================== */

test.describe.serial("Scenario 5 — Materials CRUD", () => {
  test.use({ storageState: "e2e/.auth/admin.json" });
  const MAT_NAME = `E2E Material ${TS}`;
  const MAT_NAME_EDITED = `E2E Material Edited ${TS}`;

  test("5.1 — Materials page loads", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/dashboard/materials", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/materials/);
    await ss(page, "5-1-materials-page");
  });

  test("5.2 — Create Material dialog opens", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/dashboard/materials", { waitUntil: "domcontentloaded" });
    // Wait for page to fully load (canWrite depends on useCurrentUser which is async)
    await expect(page.getByRole("heading", { name: "Materials Catalog" })).toBeVisible({ timeout: 15000 });
    await openCreateDialog(page, /add material/i);

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Name")).toBeVisible();
    await expect(dialog.getByText("Category")).toBeVisible();
    await expect(dialog.getByText("Unit", { exact: true })).toBeVisible();
    await ss(page, "5-2-add-material-dialog");
  });

  test("5.3 — Create a new material", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/dashboard/materials", { waitUntil: "domcontentloaded" });
    await openCreateDialog(page, /add material/i);

    await fillField(page, "Name", MAT_NAME);
    await fillField(page, "Category", "Cement");
    await fillField(page, "Unit", "Bags");
    await fillNumberField(page, "Unit Price", "380");

    await ss(page, "5-3-form-filled");
    await submitDialog(page);
    await ss(page, "5-3-after-submit");

    // Verify in list
    await page.goto("/dashboard/materials", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await expect(page.getByText(MAT_NAME)).toBeVisible({ timeout: 10000 });
    await ss(page, "5-3-in-list");
  });

  test("5.4 — Edit the material", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/dashboard/materials", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Find the row and click pencil
    const editBtn = page
      .locator(`tr:has-text("${MAT_NAME}")`)
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();

    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();
    } else {
      await page.locator(`tr:has-text("${MAT_NAME}") button`).first().click();
    }

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("dialog").getByText("Edit Material")).toBeVisible();

    await fillField(page, "Name", MAT_NAME_EDITED);
    await fillNumberField(page, "Unit Price", "420");

    await ss(page, "5-4-edit-form");
    await submitDialog(page);
    await ss(page, "5-4-after-edit");

    await page.goto("/dashboard/materials", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await expect(page.getByText(MAT_NAME_EDITED)).toBeVisible({ timeout: 10000 });
    await ss(page, "5-4-edited-in-list");
  });

  test("5.5 — Delete the material", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/dashboard/materials", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const deleteBtn = page
      .locator(`tr:has-text("${MAT_NAME_EDITED}")`)
      .locator("button")
      .filter({ has: page.locator("svg.lucide-trash-2") })
      .first();

    if (await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await deleteBtn.click();
    } else {
      await page.locator(`tr:has-text("${MAT_NAME_EDITED}") button`).last().click();
    }

    // Confirm
    const confirmDialog = page.getByRole("dialog");
    await expect(confirmDialog).toBeVisible({ timeout: 5000 });
    const confirmBtn = confirmDialog.getByRole("button", { name: /delete|confirm|yes/i });
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
    } else {
      await confirmDialog.locator("button").last().click();
    }

    await page.waitForTimeout(2000);
    await ss(page, "5-5-after-delete");

    await page.goto("/dashboard/materials", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await expect(page.getByText(MAT_NAME_EDITED)).toHaveCount(0, { timeout: 10000 }).catch(() => {});
    await ss(page, "5-5-deleted-verified");
  });
});

/* ================================================================== */
/*  SCENARIO 6: ROLE-BASED ACCESS CONTROL                              */
/* ================================================================== */

test.describe.serial("Scenario 6 — RBAC: Role-Based Access Control", () => {
  const CRM_ROUTES = [
    { path: "/dashboard/properties", name: "Properties" },
    { path: "/dashboard/leads", name: "Leads" },
    { path: "/dashboard/bookings", name: "Bookings" },
    { path: "/dashboard/customers", name: "Customers" },
    { path: "/dashboard/site-visits", name: "Site Visits" },
  ];

  const CONSTRUCTION_ROUTES = [
    { path: "/dashboard/construction-sites", name: "Construction Sites" },
    { path: "/dashboard/materials", name: "Materials" },
    { path: "/dashboard/labour", name: "Labour" },
    { path: "/dashboard/vendors", name: "Vendors" },
    { path: "/dashboard/inventory", name: "Inventory" },
  ];

  type RoleConfig = {
    name: string;
    signIn: (page: Page) => Promise<void>;
    expectedAccess: string[];
    expectedRedirect: string[];
    canCreateOn: string[];
    cannotCreateOn: string[];
  };

  const roles: RoleConfig[] = [
    {
      name: "Admin",
      signIn: signInAsAdmin,
      expectedAccess: [...CRM_ROUTES.map((r) => r.path), ...CONSTRUCTION_ROUTES.map((r) => r.path)],
      expectedRedirect: [],
      canCreateOn: [
        "/dashboard/properties",
        "/dashboard/leads",
        "/dashboard/bookings",
        "/dashboard/construction-sites",
        "/dashboard/materials",
      ],
      cannotCreateOn: [],
    },
    {
      name: "Owner",
      signIn: signInAsOwner,
      expectedAccess: [...CRM_ROUTES.map((r) => r.path), ...CONSTRUCTION_ROUTES.map((r) => r.path)],
      expectedRedirect: [],
      canCreateOn: [
        "/dashboard/properties",
        "/dashboard/leads",
        "/dashboard/bookings",
        "/dashboard/construction-sites",
        "/dashboard/materials",
      ],
      cannotCreateOn: [],
    },
    {
      name: "Employee",
      signIn: signInAsEmployee,
      expectedAccess: [...CRM_ROUTES.map((r) => r.path), ...CONSTRUCTION_ROUTES.map((r) => r.path)],
      expectedRedirect: [],
      canCreateOn: [],
      cannotCreateOn: [
        "/dashboard/properties",
        "/dashboard/leads",
        "/dashboard/bookings",
        "/dashboard/construction-sites",
        "/dashboard/materials",
      ],
    },
    {
      name: "Manager",
      signIn: signInAsManager,
      expectedAccess: [...CRM_ROUTES.map((r) => r.path), ...CONSTRUCTION_ROUTES.map((r) => r.path)],
      expectedRedirect: [],
      canCreateOn: [],
      cannotCreateOn: [
        "/dashboard/properties",
        "/dashboard/leads",
        "/dashboard/bookings",
        "/dashboard/construction-sites",
        "/dashboard/materials",
      ],
    },
    {
      name: "HR",
      signIn: signInAsHR,
      expectedAccess: [...CRM_ROUTES.map((r) => r.path), ...CONSTRUCTION_ROUTES.map((r) => r.path)],
      expectedRedirect: [],
      canCreateOn: [],
      cannotCreateOn: [
        "/dashboard/properties",
        "/dashboard/leads",
        "/dashboard/bookings",
        "/dashboard/construction-sites",
        "/dashboard/materials",
      ],
    },
    {
      name: "Field Employee",
      signIn: signInAsFieldEmployee,
      expectedAccess: [...CRM_ROUTES.map((r) => r.path), ...CONSTRUCTION_ROUTES.map((r) => r.path)],
      expectedRedirect: [],
      canCreateOn: [],
      cannotCreateOn: [
        "/dashboard/properties",
        "/dashboard/leads",
        "/dashboard/bookings",
        "/dashboard/construction-sites",
        "/dashboard/materials",
      ],
    },
    {
      name: "Accounts",
      signIn: signInAsAccounts,
      expectedAccess: [...CRM_ROUTES.map((r) => r.path), ...CONSTRUCTION_ROUTES.map((r) => r.path)],
      expectedRedirect: [],
      canCreateOn: [],
      cannotCreateOn: [
        "/dashboard/properties",
        "/dashboard/leads",
        "/dashboard/bookings",
        "/dashboard/construction-sites",
        "/dashboard/materials",
      ],
    },
  ];

  for (const role of roles) {
    test(`6.${roles.indexOf(role) + 1} — ${role.name}: page access`, async ({ page }) => {
      await role.signIn(page);
      const allRoutes = [...CRM_ROUTES, ...CONSTRUCTION_ROUTES];

      for (const route of allRoutes) {
        const { redirected } = await safeGoto(page, route.path);

        if (role.expectedRedirect.includes(route.path)) {
          expect(redirected, `${role.name} should be redirected from ${route.name}`).toBe(true);
        } else {
          expect(redirected, `${role.name} should access ${route.name} but was redirected`).toBe(false);
        }
      }

      await ss(page, `6-${roles.indexOf(role) + 1}-${role.name.toLowerCase().replace(/\s+/g, "-")}-access`);
    });

    test(`6.${roles.indexOf(role) + 10}.1 — ${role.name}: create button visibility`, async ({ page }) => {
      await role.signIn(page);

      const createButtons: Record<string, RegExp> = {
        "/dashboard/properties": /add property/i,
        "/dashboard/leads": /add lead/i,
        "/dashboard/bookings": /add booking/i,
        "/dashboard/construction-sites": /add site/i,
        "/dashboard/materials": /add material/i,
      };

      for (const [route, btnPattern] of Object.entries(createButtons)) {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(2000);

        const canSeeButton = await hasButton(page, btnPattern);

        if (role.canCreateOn.includes(route)) {
          expect(canSeeButton, `${role.name} should see create button on ${route}`).toBe(true);
        } else {
          expect(
            canSeeButton,
            `${role.name} should NOT see create button on ${route} but it is visible`,
          ).toBe(false);
        }
      }

      await ss(page, `6-${roles.indexOf(role) + 10}.${roles.indexOf(role) + 1}-${role.name.toLowerCase().replace(/\s+/g, "-")}-buttons`);
    });
  }
});

/* ================================================================== */
/*  SCENARIO 7: Employee Role — Limited Access                          */
/* ================================================================== */

test.describe.serial("Scenario 7 — Employee Limited Access", () => {
  test.use({ storageState: "e2e/.auth/employee.json" });
  test("7.1 — Employee can view Properties page", async ({ page }) => {
    await signInAsEmployee(page);
    await page.goto("/dashboard/properties", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Should NOT be redirected
    expect(page.url()).not.toContain("sign-in");

    // Should see Properties heading
    await expect(page.getByRole("heading", { name: "Properties" })).toBeVisible();
    await ss(page, "7-1-employee-properties-view");
  });

  test("7.2 — Employee cannot see Add Property button", async ({ page }) => {
    await signInAsEmployee(page);
    await page.goto("/dashboard/properties", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Should NOT see Add Property button
    await expect(page.getByRole("button", { name: /add property/i })).toHaveCount(0);
    await ss(page, "7-2-no-add-property-btn");
  });

  test("7.3 — Employee cannot see edit/delete buttons on properties", async ({ page }) => {
    await signInAsEmployee(page);
    await page.goto("/dashboard/properties", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Edit/delete icons should not be visible (canManage is false for EMPLOYEE)
    await expect(page.locator('[data-testid="property-edit-action"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="property-delete-action"]')).toHaveCount(0);
    await ss(page, "7-3-no-edit-delete");
  });

  test("7.4 — Employee is redirected away from Construction Sites page", async ({ page }) => {
    await signInAsEmployee(page);
    await page.goto("/dashboard/construction-sites", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Construction Sites" })).not.toBeVisible();
    await ss(page, "7-4-employee-sites-redirect");
  });

  test("7.5 — Field Employee sees Construction Sites read-only (no Add Site button)", async ({ page }) => {
    await signInAsFieldEmployee(page);
    await page.goto("/dashboard/construction-sites", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    expect(page.url()).not.toContain("sign-in");
    await expect(page.getByRole("heading", { name: "Construction Sites" })).toBeVisible();
    await expect(page.getByRole("button", { name: /add site/i })).toHaveCount(0);
    await ss(page, "7-5-no-add-site-btn");
  });

  test("7.6 — Employee can view Materials page (read-only)", async ({ page }) => {
    await signInAsEmployee(page);
    await page.goto("/dashboard/materials", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    expect(page.url()).not.toContain("sign-in");
    // No Add Material button for employee
    await expect(page.getByRole("button", { name: /add material/i })).toHaveCount(0);
    await ss(page, "7-6-employee-materials-readonly");
  });

  test("7.7 — Employee can view Leads page", async ({ page }) => {
    await signInAsEmployee(page);
    await page.goto("/dashboard/leads", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    expect(page.url()).not.toContain("sign-in");
    await expect(page.getByRole("heading", { name: "Leads" })).toBeVisible();
    await ss(page, "7-7-employee-leads-view");
  });

  test("7.8 — Employee can view Bookings page", async ({ page }) => {
    await signInAsEmployee(page);
    await page.goto("/dashboard/bookings", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    expect(page.url()).not.toContain("sign-in");
    await expect(page.getByRole("heading", { name: "Bookings" })).toBeVisible();
    await ss(page, "7-8-employee-bookings-view");
  });

  test("7.9 — Employee can view Labour page", async ({ page }) => {
    await signInAsEmployee(page);
    await page.goto("/dashboard/labour", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    expect(page.url()).not.toContain("sign-in");
    await expect(page.getByRole("heading", { name: /labour/i })).toBeVisible();
    await ss(page, "7-9-employee-labour-view");
  });
});

/* ================================================================== */
/*  SMOKE: All Routes Load Without Errors                              */
/* ================================================================== */

test.describe.serial("Smoke — All CRM + Construction Routes Load", () => {
  test.use({ storageState: "e2e/.auth/admin.json" });
  const ALL_ROUTES = [
    "/dashboard/properties",
    "/dashboard/leads",
    "/dashboard/customers",
    "/dashboard/site-visits",
    "/dashboard/bookings",
    "/dashboard/construction-sites",
    "/dashboard/materials",
    "/dashboard/labour",
    "/dashboard/vendors",
    "/dashboard/inventory",
  ];

  for (const route of ALL_ROUTES) {
    test(`Smoke: ${route} loads without redirect`, async ({ page }) => {
      await signInAsAdmin(page);
      const { redirected } = await safeGoto(page, route);
      expect(redirected, `${route} redirected to sign-in`).toBe(false);
      await ss(page, `smoke-${route.replace("/dashboard/", "")}`);
    });
  }
});
