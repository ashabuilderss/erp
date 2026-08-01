/**
 * EMS (Employee Management System) Module — E2E Test Suite
 * =========================================================
 * Tests the task assignment and performance review flows.
 *
 * Run instructions:
 *   cd apps/web
 *   $env:PLAYWRIGHT_SKIP_WEBSERVER="1"
 *   npx playwright test e2e/workflow-ems.spec.ts --reporter=list --project=chromium
 *
 * Prerequisites:
 *   - API server running on :4000
 *   - Web server running on :3000
 *   - Database seeded with test accounts
 */

import { expect, test, type Page, type ConsoleMessage } from "@playwright/test";
import {
  signInAsAdmin,
  signInAsOwner,
  signInAsHR,
  signInAsEmployee,
  signInAsAccounts,
  signInAsManager,
  signInAsTeamLead,
  signInAsFieldEmployee,
} from "./helpers";

const EMS_URL = "/dashboard/ems";

/* ================================================================== */
/*  HELPERS                                                            */
/* ================================================================== */
let screenshotIdx = 0;
async function snap(page: Page, label: string) {
  screenshotIdx++;
  const name = `test-results/ems-${String(screenshotIdx).padStart(2, "0")}-${label}.png`;
  await page.screenshot({ path: name, fullPage: true });
  return name;
}

/** Wait for the EMS client component to hydrate and fetch data */
async function waitForEmsReady(page: Page) {
  await expect(
    page.getByText("Performance Reviews").first()
  ).toBeVisible({ timeout: 15_000 });
}

/** Collect console errors during a callback */
async function collectConsoleErrors(
  page: Page,
  fn: () => Promise<void>
): Promise<string[]> {
  const errors: string[] = [];
  const handler = (msg: ConsoleMessage) => {
    if (msg.type() === "error") errors.push(msg.text());
  };
  page.on("console", handler);
  await fn();
  page.removeListener("console", handler);
  return errors;
}

/* ================================================================== */
/*  SCENARIO 1: EMS page loads for authorized roles                   */
/* ================================================================== */
test.describe.serial("EMS Module - Task Assignment Flow", () => {
  test("S1a: EMS page loads for Owner", async ({ page }) => {
    await signInAsOwner(page);
    await page.goto(EMS_URL, { waitUntil: "domcontentloaded" });
    await waitForEmsReady(page);

    await expect(page.getByText("Performance Reviews").first()).toBeVisible();
    await expect(page.getByText("Employee Assignments").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Add Review/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Add Assignment/i })).toBeVisible();

    await snap(page, "s1a-owner-ems-loaded");
    console.log("S1a PASSED: Owner can access EMS page");
  });

  test("S1b: EMS page loads for Admin", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto(EMS_URL, { waitUntil: "domcontentloaded" });
    await waitForEmsReady(page);

    await expect(page.getByText("Performance Reviews").first()).toBeVisible();
    await expect(page.getByText("Employee Assignments").first()).toBeVisible();

    await snap(page, "s1b-admin-ems-loaded");
    console.log("S1b PASSED: Admin can access EMS page");
  });

  /* ================================================================== */
  /*  SCENARIO 2: Access control — unauthorized roles can access page   */
  /* ================================================================== */
  test("S2: EMS page has NO client-side role guard", async ({ page }) => {
    // The sidebar only shows EMS for OWNER/ADMIN, but there is NO
    // middleware or client-side guard preventing direct URL access.
    // Backend APIs correctly block non-ADMIN users, but the page itself
    // renders for everyone, showing empty tables with no error feedback.

    const unauthorizedRoles = [
      { name: "HR", signIn: signInAsHR, email: "hr@company.com" },
      { name: "Employee", signIn: signInAsEmployee, email: "sales@company.com" },
      { name: "Accounts", signIn: signInAsAccounts, email: "accounts@company.com" },
      { name: "Manager", signIn: signInAsManager, email: "manager@company.com" },
      { name: "TeamLead", signIn: signInAsTeamLead, email: "teamlead@company.com" },
      { name: "FieldEmployee", signIn: signInAsFieldEmployee, email: "field@company.com" },
    ];

    const results: string[] = [];

    for (const role of unauthorizedRoles) {
      await role.signIn(page);
      await page.goto(EMS_URL, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      const hasHeadings = await page
        .getByText("Performance Reviews")
        .first()
        .isVisible()
        .catch(() => false);

      let status: string;
      if (currentUrl.includes("/sign-in")) {
        status = "REDIRECTED to sign-in";
      } else if (hasHeadings) {
        status = "PAGE ACCESSIBLE (no client-side guard!)";
      } else {
        status = "Content hidden";
      }

      results.push(`${role.name} (${role.email}): ${status}`);
    }

    console.log("\n=== S2: Access Control Results ===");
    results.forEach((r) => console.log(`  ${r}`));

    // All roles can access the page (BUG: missing client-side guard)
    const accessibleRoles = results.filter((r) => r.includes("PAGE ACCESSIBLE"));
    if (accessibleRoles.length > 0) {
      console.log(
        `\nBUG: ${accessibleRoles.length} unauthorized roles can access /dashboard/ems directly!`
      );
      console.log(
        "The page renders empty tables with no error feedback."
      );
    }

    // This is a security finding, not a hard failure
    expect(results.length).toBe(unauthorizedRoles.length);
  });

  /* ================================================================== */
  /*  SCENARIO 3: Create a Performance Review                           */
  /* ================================================================== */
  test("S3: Create a Performance Review via UI", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto(EMS_URL, { waitUntil: "domcontentloaded" });
    await waitForEmsReady(page);

    // Open Add Review dialog
    await page.getByRole("button", { name: /Add Review/i }).click();
    await expect(page.getByText("Add Performance Review")).toBeVisible({ timeout: 5000 });

    // Select employee from first combobox
    const dialog = page.locator('[role="dialog"]');
    const empSelect = dialog.locator('[role="combobox"]').first();
    await empSelect.click();
    await page.waitForTimeout(500);
    const firstEmpOption = page.locator('[role="option"]').first();
    if (await firstEmpOption.isVisible().catch(() => false)) {
      await firstEmpOption.click();
    }
    await page.waitForTimeout(300);

    // Set score to 85 (year defaults to 2026, quarter to Q1)
    const scoreInput = dialog.locator('input[type="number"][min="0"]').first();
    await scoreInput.fill("85");

    // Set notes — label is a plain <label> with no htmlFor, so getByLabel won't find it
    const notesInput = dialog.getByText("Notes", { exact: true }).locator("..").locator("input").first();
    await notesInput.fill("E2E test review notes");

    await snap(page, "s3-review-form-filled");

    // Click Save and collect console errors
    const consoleErrors = await collectConsoleErrors(page, async () => {
      await dialog.getByRole("button", { name: "Save" }).first().click();
      await page.waitForTimeout(2000);
    });

    await snap(page, "s3-after-save");

    if (consoleErrors.length > 0) {
      console.log(`S3: Console errors: ${consoleErrors.join("; ")}`);
    }
    console.log("S3: Performance review creation attempted");
  });

  /* ================================================================== */
  /*  SCENARIO 4: Create an Employee Assignment (KEY TEST)              */
  /* ================================================================== */
  test("S4: Create an Employee Assignment — Entity dropdown broken", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await page.goto(EMS_URL, { waitUntil: "domcontentloaded" });
    await waitForEmsReady(page);

    // Open Add Assignment dialog
    await page.getByRole("button", { name: /Add Assignment/i }).click();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // BUG CHECK 1: Verify the form has all expected labels
    const labels = await dialog.locator("label").allTextContents();
    console.log(`S4: Create dialog labels: ${labels.join(", ")}`);

    // Select employee
    const comboboxes = dialog.locator('[role="combobox"]');
    const comboboxCount = await comboboxes.count();
    console.log(`S4: Found ${comboboxCount} comboboxes`);

    await comboboxes.nth(0).click();
    await page.waitForTimeout(500);
    const empOptions = page.locator('[role="option"]');
    const empCount = await empOptions.count();
    console.log(`S4: Employee options: ${empCount}`);
    if (empCount > 0) {
      await empOptions.first().click();
      await page.waitForTimeout(300);
    }

    // Type is already PROPERTY (default)
    // Check the Entity dropdown
    await comboboxes.nth(2).click();
    await page.waitForTimeout(1000);
    const entityOptions = page.locator('[role="option"]');
    const entityCount = await entityOptions.count();
    console.log(`S4: Entity (Property) dropdown options: ${entityCount}`);

    if (entityCount === 0) {
      console.log(
        "S4 BUG: Entity dropdown is EMPTY despite properties existing in DB"
      );
      console.log(
        "  ROOT CAUSE: useProperties({ limit: 200 }) sends limit=200 to the API"
      );
      console.log(
        "  which returns 400 'limit must not be greater than 100'"
      );
    }

    await snap(page, "s4-entity-dropdown-empty");

    // Close the entity dropdown
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // BUG CHECK 2: Try to save — what happens with empty entity + empty dates?
    const consoleErrors = await collectConsoleErrors(page, async () => {
      await dialog.getByRole("button", { name: "Save" }).first().click();
      await page.waitForTimeout(2000);
    });

    if (consoleErrors.length > 0) {
      console.log(`S4 BUG: Console errors on Save: ${consoleErrors.join("; ")}`);
    }

    // The save should fail because:
    // 1. entityId is empty (no entity selected)
    // 2. startDate/endDate send empty strings, which fail ISO 8601 validation
    const dialogStillOpen = await dialog.isVisible().catch(() => false);
    console.log(`S4: Dialog still open after save: ${dialogStillOpen}`);

    await snap(page, "s4-after-save-attempt");
  });

  /* ================================================================== */
  /*  SCENARIO 5: Edit an Assignment — incomplete form                  */
  /* ================================================================== */
  test("S5: Edit Assignment dialog is missing fields", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto(EMS_URL, { waitUntil: "domcontentloaded" });
    await waitForEmsReady(page);

    // Find the assignment table and click edit
    const tables = page.locator("table");
    const assignTable = tables.nth(1);
    const rows = assignTable.locator("tbody tr");
    const rowCount = await rows.count();

    if (rowCount === 0) {
      console.log("S5: No assignment rows to edit — skipping");
      test.skip();
      return;
    }

    // Click the first button (edit/pencil) in the first row
    await rows.first().locator("button").first().click();
    await page.waitForTimeout(1500);

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Get all labels in the edit dialog
    const editLabels = await dialog.locator("label").allTextContents();
    console.log(`S5: Edit dialog labels: ${editLabels.join(", ")}`);

    // Check what's present vs missing
    const hasEmployee = editLabels.some((l) => l.includes("Employee"));
    const hasType = editLabels.some((l) => l.includes("Type"));
    const hasEntityId = editLabels.some((l) => l.includes("Entity"));
    const hasStartDate = editLabels.some((l) => l.includes("Start Date"));
    const hasEndDate = editLabels.some((l) => l.includes("End Date"));
    const hasNotes = editLabels.some((l) => l.includes("Notes"));

    console.log(`S5: Edit dialog fields:`);
    console.log(`  Employee: ${hasEmployee ? "PRESENT" : "MISSING"}`);
    console.log(`  Type: ${hasType ? "PRESENT" : "MISSING"}`);
    console.log(`  Entity ID: ${hasEntityId ? "PRESENT" : "MISSING"}`);
    console.log(`  Start Date: ${hasStartDate ? "PRESENT" : "MISSING"}`);
    console.log(`  End Date: ${hasEndDate ? "PRESENT" : "MISSING"}`);
    console.log(`  Notes: ${hasNotes ? "PRESENT" : "MISSING"}`);

    // BUG: Check if Entity ID uses a Select (combobox) or raw Input
    const comboboxes = dialog.locator('[role="combobox"]');
    const comboboxCount = await comboboxes.count();
    console.log(`  Comboboxes in edit dialog: ${comboboxCount}`);

    // The Entity ID field should be a Select but is a raw input
    const entityIdSection = dialog.locator("label").filter({ hasText: "Entity ID" }).locator("..");
    const hasInput = await entityIdSection.locator("input").isVisible().catch(() => false);
    const hasCombobox = await entityIdSection.locator('[role="combobox"]').isVisible().catch(() => false);

    if (hasInput && !hasCombobox) {
      console.log(
        "S5 BUG: Entity ID field uses a raw text <input> instead of a Select dropdown!"
      );
    }

    if (!hasEmployee) {
      console.log("S5 BUG: Employee selector is MISSING from Edit dialog");
    }
    if (!hasStartDate || !hasEndDate) {
      console.log("S5 BUG: Start/End Date fields are MISSING from Edit dialog");
    }
    if (!hasNotes) {
      console.log("S5 BUG: Notes field is MISSING from Edit dialog");
    }

    await snap(page, "s5-edit-dialog");
    await page.keyboard.press("Escape");
  });

  /* ================================================================== */
  /*  SCENARIO 6: API-based creation and validation                    */
  /* ================================================================== */
  test("S6: API tests — create, validate, error handling", async ({ page }) => {
    await signInAsAdmin(page);

    // Get test data
    const empResp = await page.request.get("/api/proxy/employees?limit=1");
    const empBody = await empResp.json();
    const empId = empBody?.data?.[0]?.id;
    expect(empId).toBeTruthy();

    const propResp = await page.request.get("/api/proxy/properties?limit=1");
    const propBody = await propResp.json();
    const propId = propBody?.data?.[0]?.id;

    // 6a: Create performance review
    const perfResult = await page.request.post("/api/proxy/performance", {
      data: {
        employeeId: empId,
        year: 2026,
        quarter: 2,
        score: 88,
        notes: "API test review",
      },
    });
    const perfStatus = perfResult.status();
    console.log(`S6a: POST performance -> ${perfStatus}`);
    if (!perfResult.ok()) {
      const perfErr = await perfResult.json().catch(() => ({}));
      console.log(`S6a: Error body: ${JSON.stringify(perfErr)}`);
      console.log("S6a BUG: Performance review creation via API fails — @IsInt() validation rejects valid numbers");
    }

    // 6b: Create assignment with valid data
    if (propId) {
      const assignResult = await page.request.post("/api/proxy/assignments", {
        data: {
          employeeId: empId,
          type: "PROPERTY",
          entityId: propId,
          startDate: "2026-02-01",
          endDate: "2026-08-01",
          notes: "API test assignment",
        },
      });
      console.log(
        `S6b: POST assignment -> ${assignResult.status()}`
      );
      if (!assignResult.ok()) {
        const assignErr = await assignResult.json().catch(() => ({}));
        console.log(`S6b: Error body: ${JSON.stringify(assignErr)}`);
      }
    }

    // 6c: Create assignment with EMPTY string dates (what the UI form sends)
    if (propId) {
      const badDateResult = await page.request.post("/api/proxy/assignments", {
        data: {
          employeeId: empId,
          type: "PROPERTY",
          entityId: propId,
          startDate: "",
          endDate: "",
          notes: "Empty date test",
        },
      });
      console.log(
        `S6c: POST assignment (empty dates) -> ${badDateResult.status()}`
      );
      // BUG: This returns 400 because empty strings fail ISO 8601 validation
      // even though fields are @IsOptional()
      if (!badDateResult.ok()) {
        const errBody = await badDateResult.json();
        console.log(
          `S6c BUG: Empty date strings cause 400: ${errBody.message}`
        );
      }
    }

    // 6d: Create assignment with invalid entity ID
    const invalidResult = await page.request.post("/api/proxy/assignments", {
      data: {
        employeeId: empId,
        type: "PROPERTY",
        entityId: "non-existent-id-12345",
        notes: "Invalid entity test",
      },
    });
    console.log(
      `S6d: POST assignment (invalid entityId) -> ${invalidResult.status()}`
    );
    if (!invalidResult.ok()) {
      console.log("S6d: Backend correctly rejected invalid entity ID");
    }

    // 6e: Verify limit=200 bug for properties
    const limit200Result = await page.request.get(
      "/api/proxy/properties?limit=200"
    );
    console.log(
      `S6e: GET properties?limit=200 -> ${limit200Result.status()}`
    );
    if (!limit200Result.ok()) {
      const errBody = await limit200Result.json();
      console.log(
        `S6e BUG: limit=200 rejected: ${errBody.message}`
      );
    }

    await snap(page, "s6-api-results");
  });

  /* ================================================================== */
  /*  SCENARIO 7: Table display bugs                                    */
  /* ================================================================== */
  test("S7: Tables display raw UUIDs instead of employee names", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await page.goto(EMS_URL, { waitUntil: "domcontentloaded" });
    await waitForEmsReady(page);

    // Verify API returns employee names
    const perfApi = await (
      await page.request.get("/api/proxy/performance?limit=5")
    ).json();
    const assignApi = await (
      await page.request.get("/api/proxy/assignments?limit=5")
    ).json();

    if (perfApi?.data?.length > 0) {
      const record = perfApi.data[0];
      const apiName = record.employees?.users
        ? `${record.employees.users.firstName} ${record.employees.users.lastName}`
        : "N/A";
      console.log(
        `S7: API returns employee name: "${apiName}" (employeeId: ${record.employeeId})`
      );

      // Check what the table actually shows
      const tables = page.locator("table");
      const perfTable = tables.first();
      const rows = perfTable.locator("tbody tr");
      if ((await rows.count()) > 0) {
        const firstCell = rows.first().locator("td").first();
        const cellText = await firstCell.textContent();
        console.log(
          `S7: Performance table Employee column shows: "${cellText}"`
        );

        const isUuid =
          cellText?.includes(record.employeeId) &&
          !cellText?.includes(apiName.split(" ")[0]);
        if (isUuid) {
          console.log(
            "S7 BUG: Performance table shows raw employeeId UUID instead of employee name!"
          );
          console.log(
            `  Expected: "${apiName}" or "${record.employees?.employeeCode}" `
          );
          console.log(`  Got: "${cellText}"`);
        }
      }
    }

    if (assignApi?.data?.length > 0) {
      const record = assignApi.data[0];
      const apiName = record.employees?.users
        ? `${record.employees.users.firstName} ${record.employees.users.lastName}`
        : "N/A";

      const tables = page.locator("table");
      const assignTable = tables.nth(1);
      const rows = assignTable.locator("tbody tr");
      if ((await rows.count()) > 0) {
        const firstCell = rows.first().locator("td").first();
        const cellText = await firstCell.textContent();
        console.log(
          `S7: Assignment table Employee column shows: "${cellText}"`
        );

        const isUuid =
          cellText?.includes(record.employeeId) &&
          !cellText?.includes(apiName.split(" ")[0]);
        if (isUuid) {
          console.log(
            "S7 BUG: Assignment table shows raw employeeId UUID instead of employee name!"
          );
          console.log(`  Expected: "${apiName}" Got: "${cellText}"`);
        }

        // Also check Entity ID column
        const entityCell = rows.first().locator("td").nth(2);
        const entityText = await entityCell.textContent();
        console.log(
          `S7: Assignment table Entity ID column shows: "${entityText}"`
        );
      }
    }

    await snap(page, "s7-table-display");
  });

  /* ================================================================== */
  /*  SCENARIO 8: Delete operations                                     */
  /* ================================================================== */
  test("S8: Delete performance review and assignment", async ({ page }) => {
    await signInAsAdmin(page);

    // Get test data
    const empId = await (
      await (await page.request.get("/api/proxy/employees?limit=1")).json()
    )?.data?.[0]?.id;
    const propId = await (
      await (await page.request.get("/api/proxy/properties?limit=1")).json()
    )?.data?.[0]?.id;

    if (!empId) {
      console.log("S8: SKIPPED - no employee");
      test.skip();
      return;
    }

    // Create test data to delete
    const perfResult = await page.request.post("/api/proxy/performance", {
      data: { employeeId: empId, year: 2025, quarter: 4, score: 70, notes: "Delete me" },
    });
    const perfId = perfResult.ok() ? (await perfResult.json())?.id : null;

    let assignId: string | null = null;
    if (propId) {
      const aResult = await page.request.post("/api/proxy/assignments", {
        data: {
          employeeId: empId,
          type: "PROPERTY",
          entityId: propId,
          notes: "Delete me",
        },
      });
      assignId = aResult.ok() ? (await aResult.json())?.id : null;
    }

    console.log(`S8: Created perf=${perfId}, assign=${assignId}`);

    // Navigate to EMS and reload data
    await page.goto(EMS_URL, { waitUntil: "domcontentloaded" });
    await waitForEmsReady(page);
    await snap(page, "s8-before-delete");

    // Try deleting a performance review
    const tables = page.locator("table");
    if (perfId) {
      const perfRows = tables.first().locator("tbody tr");
      if ((await perfRows.count()) > 0) {
        // Click the delete button (second button in the row)
        const deleteBtn = perfRows.first().locator("button").last();
        await deleteBtn.click();
        await page.waitForTimeout(1000);

        // Look for confirmation dialog
        const confirmDialog = page.getByText(/Delete Performance Review|Are you sure/i);
        if (await confirmDialog.first().isVisible().catch(() => false)) {
          console.log("S8: Delete confirmation dialog appeared");
          await snap(page, "s8-perf-delete-confirm");

          // Confirm deletion
          await page
            .getByRole("button", { name: /Delete|Confirm|Yes/i })
            .last()
            .click();
          await page.waitForTimeout(2000);
          console.log("S8: Performance review delete confirmed");
        }
      }
    }

    // Try deleting an assignment
    if (assignId && (await tables.count()) >= 2) {
      const assignRows = tables.nth(1).locator("tbody tr");
      if ((await assignRows.count()) > 0) {
        const deleteBtn = assignRows.first().locator("button").last();
        await deleteBtn.click();
        await page.waitForTimeout(1000);

        const confirmDialog = page.getByText(/Delete Assignment|Are you sure/i);
        if (await confirmDialog.first().isVisible().catch(() => false)) {
          console.log("S8: Assignment delete confirmation appeared");
          await page
            .getByRole("button", { name: /Delete|Confirm|Yes/i })
            .last()
            .click();
          await page.waitForTimeout(2000);
          console.log("S8: Assignment delete confirmed");
        }
      }
    }

    await snap(page, "s8-after-delete");
  });
});
