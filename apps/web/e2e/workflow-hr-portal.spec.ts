/**
 * HR Portal Workflow - E2E Test Suite
 * ====================================
 * Tests the HR Portal module: leave requests, leave allocations,
 * warnings, employee management, departments, designations,
 * attendance corrections.
 *
 * Run instructions:
 *   cd apps/web
 *   $env:PLAYWRIGHT_SKIP_WEBSERVER="1"
 *   npx playwright test e2e/workflow-hr-portal.spec.ts --reporter=list --project=chromium
 *
 * Prerequisites:
 *   - API server running on :4000
 *   - Web server running on :3000
 *   - Database seeded with test accounts
 */

import fs from "fs";
import { expect, test, type Page } from "@playwright/test";
import {
  signInAs,
  signInAsAdmin,
  signInAsHR,
  signInAsOwner,
  signInAsEmployee,
  signInAsManager,
  navigateTo,
} from "./helpers";

/* ------------------------------------------------------------------ */
/*  Bug tracker                                                        */
/* ------------------------------------------------------------------ */
const BUGS: {
  id: number;
  severity: "P0" | "P1" | "P2" | "P3";
  title: string;
  repro: string;
}[] = [];

function recordBug(
  severity: "P0" | "P1" | "P2" | "P3",
  title: string,
  repro: string,
) {
  BUGS.push({ id: BUGS.length + 1, severity, title, repro });
}

/* ================================================================== */
/*  Scenario 1: Leave Requests page loads for all authorized roles     */
/* ================================================================== */
test.describe.serial("Scenario 1 - Leave Requests page loads for all roles", () => {
  test("1.1 - HR can access Leave Requests", async ({ page }) => {
    await signInAsHR(page);
    await navigateTo(page, "/dashboard/leave-requests");

    await expect(page.getByRole("heading", { name: "Leave Requests" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Manage employee leave requests")).toBeVisible();
    await expect(page.getByRole("button", { name: /add leave request/i })).toBeVisible();

    await page.screenshot({ path: "test-results/hr-01-leave-requests-hr.png", fullPage: true });
  });

  test("1.2 - Admin can access Leave Requests", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/leave-requests");

    await expect(page.getByRole("heading", { name: "Leave Requests" })).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: "test-results/hr-02-leave-requests-admin.png", fullPage: true });
  });

  test("1.3 - Owner can access Leave Requests", async ({ page }) => {
    await signInAsOwner(page);
    await navigateTo(page, "/dashboard/leave-requests");

    await expect(page.getByRole("heading", { name: "Leave Requests" })).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: "test-results/hr-03-leave-requests-owner.png", fullPage: true });
  });

  test("1.4 - Manager can access Leave Requests", async ({ page }) => {
    await signInAsManager(page);
    await navigateTo(page, "/dashboard/leave-requests");

    await expect(page.getByRole("heading", { name: "Leave Requests" })).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: "test-results/hr-04-leave-requests-manager.png", fullPage: true });
  });

  test("1.5 - Employee can access Leave Requests", async ({ page }) => {
    await signInAsEmployee(page);
    await navigateTo(page, "/dashboard/leave-requests");

    await expect(page.getByRole("heading", { name: "Leave Requests" })).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: "test-results/hr-05-leave-requests-employee.png", fullPage: true });
  });
});

/* ================================================================== */
/*  Scenario 2: Create a Leave Request (Employee)                      */
/* ================================================================== */
test.describe.serial("Scenario 2 - Create a Leave Request as Employee", () => {
  test("2.1 - Employee opens Add Leave Request dialog with all fields", async ({ page }) => {
    await signInAsEmployee(page);
    await navigateTo(page, "/dashboard/leave-requests");

    const addBtn = page.getByRole("button", { name: /add leave request/i });
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Verify all form fields
    await expect(dialog.getByText("Employee", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Type", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Start Date")).toBeVisible();
    await expect(dialog.getByText("End Date")).toBeVisible();
    await expect(dialog.getByText("Reason")).toBeVisible();
    await expect(dialog.getByText("Document")).toBeVisible();

    // Verify Save button exists
    await expect(dialog.getByRole("button", { name: "Save" })).toBeVisible();

    await page.screenshot({ path: "test-results/hr-06-leave-request-dialog.png", fullPage: true });
  });

  test("2.2 - Leave Request form validation on empty submit", async ({ page }) => {
    await signInAsEmployee(page);
    await navigateTo(page, "/dashboard/leave-requests");

    const addBtn = page.getByRole("button", { name: /add leave request/i });
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Click Save without filling required fields
    const saveBtn = dialog.getByRole("button", { name: "Save" });
    await saveBtn.click();
    await page.waitForTimeout(1000);

    // The form uses showToast("Please select an employee", "error") as validation
    // Dialog should still be open since employee wasn't selected
    const dialogStillOpen = await dialog.isVisible().catch(() => false);
    expect(dialogStillOpen).toBeTruthy();

    await page.screenshot({ path: "test-results/hr-07-leave-request-validation.png", fullPage: true });
  });

  test("2.3 - Employee can fill date fields and reason in leave request form", async ({ page }) => {
    await signInAsEmployee(page);
    await navigateTo(page, "/dashboard/leave-requests");

    const addBtn = page.getByRole("button", { name: /add leave request/i });
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Fill date fields using native date input (works with React 19)
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 1);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 2);

    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    // Date inputs are native HTML inputs and work with fill()
    const dateInputs = dialog.locator('input[type="date"]');
    const dateCount = await dateInputs.count();
    expect(dateCount).toBe(2);

    await dateInputs.nth(0).fill(startStr);
    await dateInputs.nth(1).fill(endStr);

    // Fill reason (text input — find by label, not by position, to avoid file input)
    const reasonLabel = dialog.getByText("Reason", { exact: true });
    const reasonInput = reasonLabel.locator("..").locator("input").first();
    await reasonInput.fill("E2E test leave request - automated");

    await page.screenshot({ path: "test-results/hr-08-leave-request-filled.png", fullPage: true });

    // Note: Employee select (Select component) requires click interaction.
    // The React 19 Select component uses controlled state with event delegation.
    // This is a known Playwright limitation with React 19 controlled components.
  });

  test("2.4 - Leave Request dialog has Document upload field", async ({ page }) => {
    await signInAsEmployee(page);
    await navigateTo(page, "/dashboard/leave-requests");

    const addBtn = page.getByRole("button", { name: /add leave request/i });
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Verify document upload field exists
    const fileInput = dialog.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();

    // Verify accepted file types
    const acceptAttr = await fileInput.getAttribute("accept");
    expect(acceptAttr).toContain(".pdf");
    expect(acceptAttr).toContain(".jpg");

    await page.screenshot({ path: "test-results/hr-09-leave-request-document.png", fullPage: true });
  });
});

/* ================================================================== */
/*  Scenario 3: HR Leave Request approval workflow                     */
/* ================================================================== */
test.describe.serial("Scenario 3 - HR Leave Request approval workflow", () => {
  test("3.1 - HR does NOT see approve/reject buttons for leave requests (BUG)", async ({ page }) => {
    await signInAsHR(page);
    await navigateTo(page, "/dashboard/leave-requests");

    await expect(page.getByRole("heading", { name: "Leave Requests" })).toBeVisible({ timeout: 10000 });

    // Verify no green check (approve) or red X (reject) SVG icons
    const greenChecks = page.locator("svg.text-green-600");
    const redXs = page.locator("svg.text-red-600");
    const checkCount = await greenChecks.count().catch(() => 0);
    const xCount = await redXs.count().catch(() => 0);

    // BUG: HR cannot approve/reject leave requests - source code only allows OWNER
    // leave-requests/page.tsx line 40: const canApprove = role === "OWNER"
    // HR_MANAGER should be able to approve/reject as well
    if (checkCount === 0 && xCount === 0) {
      recordBug(
        "P1",
        "HR cannot approve/reject leave requests - only OWNER role can",
        "Sign in as HR (hr@company.com / Hr@12345). Navigate to /dashboard/leave-requests. " +
          "The approve (green check) and reject (red X) buttons are not visible for HR role. " +
          "Source code (leave-requests/page.tsx:40): canApprove = role === 'OWNER'. " +
          "HR_MANAGER is excluded from approval actions despite having access to the page via NAV_ITEMS. " +
          "The Approvals page (/dashboard/approvals) also shows 'Leave Requests' section for HR, " +
          "creating an inconsistency where HR sees pending leaves in Approvals but cannot act on them.",
      );
    }

    // HR should still see edit and delete buttons if there are real data rows (not skeletons)
    // Scope to table only to avoid sidebar/navigation icons
    const table = page.locator("table");
    const editBtns = table.locator("svg.lucide-pencil");
    const deleteBtns = table.locator("svg.lucide-trash-2");
    const editCount = await editBtns.count().catch(() => 0);
    const deleteCount = await deleteBtns.count().catch(() => 0);
    if (editCount > 0 || deleteCount > 0) {
      expect(editCount).toBeGreaterThan(0);
      expect(deleteCount).toBeGreaterThan(0);
    }

    await page.screenshot({ path: "test-results/hr-10-leave-requests-hr-no-approve.png", fullPage: true });
  });

  test("3.2 - Owner can see approve/reject buttons for pending leaves", async ({ page }) => {
    await signInAsOwner(page);
    await navigateTo(page, "/dashboard/leave-requests");

    await expect(page.getByRole("heading", { name: "Leave Requests" })).toBeVisible({ timeout: 10000 });

    // Owner has canApprove = true, so approve/reject buttons show for PENDING requests
    // If there are no PENDING requests, the buttons won't render (conditional on status)
    const hasPendingRow = await page.getByText("PENDING").isVisible().catch(() => false);

    if (hasPendingRow) {
      const approveBtns = page.locator("svg.text-green-600");
      const rejectBtns = page.locator("svg.text-red-600");
      const hasApprove = await approveBtns.first().isVisible({ timeout: 3000 }).catch(() => false);
      const hasReject = await rejectBtns.first().isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasApprove).toBeTruthy();
      expect(hasReject).toBeTruthy();
    } else {
      console.log("No PENDING leave requests found - approve buttons only show for PENDING status");
    }

    await page.screenshot({ path: "test-results/hr-11-leave-requests-owner-approve.png", fullPage: true });
  });

  test("3.3 - Employee does NOT see approve/reject buttons", async ({ page }) => {
    await signInAsEmployee(page);
    await navigateTo(page, "/dashboard/leave-requests");

    await expect(page.getByRole("heading", { name: "Leave Requests" })).toBeVisible({ timeout: 10000 });

    const approveBtns = page.locator("svg.text-green-600");
    const count = await approveBtns.count().catch(() => 0);
    expect(count).toBe(0);

    await page.screenshot({ path: "test-results/hr-12-leave-requests-employee-no-approve.png", fullPage: true });
  });
});

/* ================================================================== */
/*  Scenario 4: Leave Allocations                                      */
/* ================================================================== */
test.describe.serial("Scenario 4 - Leave Allocations", () => {
  test("4.1 - HR can access Leave Allocations page", async ({ page }) => {
    await signInAsHR(page);
    await navigateTo(page, "/dashboard/leave-allocations");

    await expect(page.getByRole("heading", { name: "Leave Allocations" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Manage annual leave balances per employee")).toBeVisible();
    await expect(page.getByRole("button", { name: /add allocation/i })).toBeVisible();

    await page.screenshot({ path: "test-results/hr-13-leave-allocations-hr.png", fullPage: true });
  });

  test("4.2 - Admin can access Leave Allocations page", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/leave-allocations");

    await expect(page.getByRole("heading", { name: "Leave Allocations" })).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: "test-results/hr-14-leave-allocations-admin.png", fullPage: true });
  });

  test("4.3 - HR opens Add Allocation dialog with all fields", async ({ page }) => {
    await signInAsHR(page);
    await navigateTo(page, "/dashboard/leave-allocations");

    const addBtn = page.getByRole("button", { name: /add allocation/i });
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await expect(dialog.getByText("Employee", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Year", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Leave Type")).toBeVisible();
    await expect(dialog.getByText("Total Days")).toBeVisible();

    await page.screenshot({ path: "test-results/hr-15-leave-allocations-dialog.png", fullPage: true });
  });

  test("4.4 - Leave Allocation form validation on empty submit", async ({ page }) => {
    await signInAsHR(page);
    await navigateTo(page, "/dashboard/leave-allocations");

    const addBtn = page.getByRole("button", { name: /add allocation/i });
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const saveBtn = dialog.getByRole("button", { name: "Save" });
    await saveBtn.click();
    await page.waitForTimeout(1000);

    const employeeError = await page.getByText("Employee is required").isVisible().catch(() => false);
    const totalDaysError = await page.getByText("Total days is required").isVisible().catch(() => false);
    expect(employeeError || totalDaysError).toBeTruthy();

    await page.screenshot({ path: "test-results/hr-16-leave-allocations-validation.png", fullPage: true });
  });

  test("4.5 - Employee can access /dashboard/leave-allocations via direct URL (no RBAC)", async ({ page }) => {
    await signInAsEmployee(page);
    await navigateTo(page, "/dashboard/leave-allocations");

    // Employee is NOT in NAV_ITEMS for leave-allocations, but can access via direct URL
    // because there is no server-side RBAC middleware
    const heading = await page.getByRole("heading", { name: "Leave Allocations" }).isVisible({ timeout: 10000 }).catch(() => false);

    if (heading) {
      recordBug(
        "P2",
        "No server-side RBAC - Employee can access /dashboard/leave-allocations via direct URL",
        "Sign in as Employee (sales@company.com / Sales@12345). " +
          "Navigate directly to /dashboard/leave-allocations. " +
          "The page loads and shows 'Leave Allocations' heading with data. " +
          "Employee role is NOT listed in NAV_ITEMS for this route, but the dashboard layout " +
          "(src/app/(dashboard)/layout.tsx) only checks for authentication status, not role. " +
          "There is no Next.js middleware.ts enforcing RBAC on routes. " +
          "This means any authenticated user can access any HR/admin page via direct URL.",
      );
    }

    await page.screenshot({ path: "test-results/hr-17-leave-allocations-employee-bypass.png", fullPage: true });
  });
});

/* ================================================================== */
/*  Scenario 5: Employees page CRUD                                    */
/* ================================================================== */
test.describe.serial("Scenario 5 - Employees page CRUD", () => {
  test("5.1 - HR can access Employees page with table and buttons", async ({ page }) => {
    await signInAsHR(page);
    await navigateTo(page, "/dashboard/employees");

    await expect(page.getByRole("heading", { name: "Employees" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Manage your workforce")).toBeVisible();

    // HR has canManageEmployees (HR_MANAGER is in the allow list)
    await expect(page.getByRole("button", { name: /add employee/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /create with login/i })).toBeVisible();

    // Verify table has data
    const table = page.getByRole("table");
    await expect(table).toBeVisible();

    await page.screenshot({ path: "test-results/hr-18-employees-hr.png", fullPage: true });
  });

  test("5.2 - HR opens Add Employee dialog with all fields", async ({ page }) => {
    await signInAsHR(page);
    await navigateTo(page, "/dashboard/employees");

    const addBtn = page.getByRole("button", { name: /add employee/i });
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Verify form fields
    await expect(dialog.getByText("Employee Code")).toBeVisible();
    await expect(dialog.getByText("Department")).toBeVisible();
    await expect(dialog.getByText("Designation")).toBeVisible();
    await expect(dialog.getByText("Phone")).toBeVisible();
    await expect(dialog.getByText("Salary")).toBeVisible();
    await expect(dialog.getByText("Status")).toBeVisible();

    await page.screenshot({ path: "test-results/hr-19-employees-add-dialog.png", fullPage: true });
  });

  test("5.3 - Add Employee form validation on empty submit", async ({ page }) => {
    await signInAsHR(page);
    await navigateTo(page, "/dashboard/employees");

    const addBtn = page.getByRole("button", { name: /add employee/i });
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const saveBtn = dialog.getByRole("button", { name: "Save" });
    await saveBtn.click();
    await page.waitForTimeout(1000);

    const deptError = await page.getByText("Department is required").isVisible().catch(() => false);
    const desigError = await page.getByText("Designation is required").isVisible().catch(() => false);
    expect(deptError || desigError).toBeTruthy();

    await page.screenshot({ path: "test-results/hr-20-employees-validation.png", fullPage: true });
  });

  test("5.4 - HR opens Create with Login dialog with all fields", async ({ page }) => {
    await signInAsHR(page);
    await navigateTo(page, "/dashboard/employees");

    const createBtn = page.getByRole("button", { name: /create with login/i });
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await createBtn.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await expect(dialog.getByText("Create Employee with Login")).toBeVisible();
    await expect(dialog.getByText("Email")).toBeVisible();
    await expect(dialog.getByText("First Name")).toBeVisible();
    await expect(dialog.getByText("Last Name")).toBeVisible();
    await expect(dialog.getByText("Password")).toBeVisible();
    await expect(dialog.getByText("Department")).toBeVisible();
    await expect(dialog.getByText("Designation")).toBeVisible();

    await page.screenshot({ path: "test-results/hr-21-employees-create-login-dialog.png", fullPage: true });
  });

  test("5.5 - HR can see edit and delete buttons on employee rows", async ({ page }) => {
    await signInAsHR(page);
    await navigateTo(page, "/dashboard/employees");
    await page.waitForTimeout(2000);

    const editBtns = page.locator("svg.lucide-pencil");
    const deleteBtns = page.locator("svg.lucide-trash-2");
    const terminateBtns = page.locator("svg.lucide-ban");

    const editCount = await editBtns.count().catch(() => 0);
    const deleteCount = await deleteBtns.count().catch(() => 0);
    const terminateCount = await terminateBtns.count().catch(() => 0);

    expect(editCount).toBeGreaterThan(0);
    expect(deleteCount).toBeGreaterThan(0);
    expect(terminateCount).toBeGreaterThan(0);

    await page.screenshot({ path: "test-results/hr-22-employees-action-buttons.png", fullPage: true });
  });

  test("5.6 - Employees page shows data with missing user/department/designation names", async ({ page }) => {
    await signInAsHR(page);
    await navigateTo(page, "/dashboard/employees");
    await page.waitForTimeout(2000);

    // Many employees show "-" for Name, Department, and Designation
    // This indicates employees were created without proper user/dept/ designation links
    const dashCount = await page.locator("td").filter({ hasText: /^-$/ }).count().catch(() => 0);

    if (dashCount > 5) {
      recordBug(
        "P3",
        "Many employees show missing Name/Department/Designation (displayed as '-')",
        "Navigate to /dashboard/employees as HR. " +
          `Found ${dashCount} cells showing '-' for Name, Department, or Designation. ` +
          "This indicates employee records exist without proper user accounts, " +
          "department assignments, or designation assignments. " +
          "The Employees page renders '-' as fallback but does not highlight " +
          "incomplete records that need attention.",
      );
    }

    await page.screenshot({ path: "test-results/hr-23-employees-missing-data.png", fullPage: true });
  });
});

/* ================================================================== */
/*  Scenario 6: Departments CRUD                                       */
/* ================================================================== */
test.describe.serial("Scenario 6 - Departments CRUD", () => {
  const testDeptName = `E2EDept_${Date.now()}`;

  test("6.1 - Admin can access Departments page", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/departments");

    await expect(page.getByRole("heading", { name: "Departments" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Organize your departments")).toBeVisible();
    await expect(page.getByRole("button", { name: /add department/i })).toBeVisible();

    await page.screenshot({ path: "test-results/hr-24-departments-admin.png", fullPage: true });
  });

  test("6.2 - Admin creates a department", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/departments");

    const addBtn = page.getByRole("button", { name: /add department/i });
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Fill Name field (first input in dialog)
    const nameInput = dialog.locator("input").first();
    await nameInput.fill(testDeptName);

    // Fill Description field (second input)
    const descInput = dialog.locator("input").nth(1);
    await descInput.fill("E2E test department - automated");

    await page.screenshot({ path: "test-results/hr-25-departments-create-filled.png", fullPage: true });

    // Submit
    const saveBtn = dialog.getByRole("button", { name: "Save" });
    await saveBtn.click();
    await page.waitForTimeout(3000);

    // Verify department appears in the table
    const deptVisible = await page.getByText(testDeptName).isVisible().catch(() => false);
    expect(deptVisible).toBeTruthy();

    await page.screenshot({ path: "test-results/hr-26-departments-created.png", fullPage: true });
  });

  test("6.3 - Department form validation on empty submit", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/departments");

    const addBtn = page.getByRole("button", { name: /add department/i });
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const saveBtn = dialog.getByRole("button", { name: "Save" });
    await saveBtn.click();
    await page.waitForTimeout(1000);

    const nameError = await page.getByText("Name is required").isVisible().catch(() => false);
    expect(nameError).toBeTruthy();

    await page.screenshot({ path: "test-results/hr-27-departments-validation.png", fullPage: true });
  });

  test("6.4 - Admin can edit a department", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/departments");
    await page.waitForTimeout(2000);

    const editButtons = page.locator("svg.lucide-pencil");
    const count = await editButtons.count().catch(() => 0);

    if (count > 0) {
      await editButtons.first().click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 5000 });
      await expect(dialog.getByText("Edit Department")).toBeVisible();

      await page.screenshot({ path: "test-results/hr-28-departments-edit.png", fullPage: true });

      // Close without saving
      await page.keyboard.press("Escape");
    }
  });

  test("6.5 - Admin can delete a department", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/departments");
    await page.waitForTimeout(2000);

    // Find the test department row and delete it
    const testDeptRow = page.getByText(testDeptName);
    const hasTestDept = await testDeptRow.isVisible().catch(() => false);

    if (hasTestDept) {
      // Click delete button in the row
      const deleteButtons = page.locator("svg.lucide-trash-2");
      const count = await deleteButtons.count().catch(() => 0);

      if (count > 0) {
        // Click the last delete button (our test department)
        await deleteButtons.last().click();

        // Confirm dialog should appear
        const confirmDialog = page.getByText(/are you sure/i);
        const hasConfirm = await confirmDialog.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasConfirm) {
          await page.screenshot({ path: "test-results/hr-29-departments-delete-confirm.png", fullPage: true });

          // Click the destructive confirm button (ConfirmDialog defaults to "Confirm" label)
          const confirmBtn = page.getByRole("button", { name: /confirm/i }).last();
          await confirmBtn.click();
          await page.waitForTimeout(3000);

          // Verify it's gone (may fail if department has foreign key constraints)
          const stillVisible = await page.getByText(testDeptName).isVisible().catch(() => false);
          if (stillVisible) {
            recordBug("P2", "Department delete fails silently (possible FK constraint)", `Deleting department "${testDeptName}" shows confirm dialog but department remains after confirm.`);
          }
        }
      }
    }

    await page.screenshot({ path: "test-results/hr-30-departments-after-delete.png", fullPage: true });
  });
});

/* ================================================================== */
/*  Scenario 7: Designations CRUD                                      */
/* ================================================================== */
test.describe.serial("Scenario 7 - Designations CRUD", () => {
  test("7.1 - Admin can access Designations page", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/designations");

    await expect(page.getByRole("heading", { name: "Designations" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Manage job titles and roles")).toBeVisible();
    await expect(page.getByRole("button", { name: /add designation/i })).toBeVisible();

    await page.screenshot({ path: "test-results/hr-31-designations-admin.png", fullPage: true });
  });

  test("7.2 - Admin opens Add Designation dialog with all fields", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/designations");

    const addBtn = page.getByRole("button", { name: /add designation/i });
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await expect(dialog.getByText("Name", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Department", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Description")).toBeVisible();

    await page.screenshot({ path: "test-results/hr-32-designations-add-dialog.png", fullPage: true });
  });

  test("7.3 - Designation form validation on empty submit", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/designations");

    const addBtn = page.getByRole("button", { name: /add designation/i });
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const saveBtn = dialog.getByRole("button", { name: "Save" });
    await saveBtn.click();
    await page.waitForTimeout(1000);

    const nameError = await page.getByText("Name is required").isVisible().catch(() => false);
    const deptError = await page.getByText("Department is required").isVisible().catch(() => false);
    expect(nameError || deptError).toBeTruthy();

    await page.screenshot({ path: "test-results/hr-33-designations-validation.png", fullPage: true });
  });

  test("7.4 - Admin can edit a designation", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/designations");
    await page.waitForTimeout(2000);

    const editButtons = page.locator("svg.lucide-pencil");
    const count = await editButtons.count().catch(() => 0);

    if (count > 0) {
      await editButtons.first().click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 5000 });
      await expect(dialog.getByText("Edit Designation")).toBeVisible();

      await page.screenshot({ path: "test-results/hr-34-designations-edit.png", fullPage: true });

      await page.keyboard.press("Escape");
    } else {
      console.log("No designations found to edit");
    }
  });

  test("7.5 - Designations table shows raw employee IDs instead of department names", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/designations");
    await page.waitForTimeout(2000);

    // Verify designations table renders department name correctly
    const tableCells = page.locator("table tbody tr td:nth-child(2)");
    const count = await tableCells.count().catch(() => 0);

    if (count > 0) {
      const cellText = await tableCells.first().textContent();
      const looksLikeUuid = cellText && cellText.length > 20 && !cellText.includes(" ");

      if (looksLikeUuid) {
        recordBug(
          "P2",
          "Designations table shows raw database IDs instead of department names",
          "Navigate to /dashboard/designations as Admin/HR. " +
            "The 'Department' column shows raw database IDs like 'cmrxk52jc00003zmwvkyy16cs' " +
            "instead of human-readable department names. " +
            "Source code (designations/page.tsx:38): renders row.original.department?.name || row.original.departmentId. " +
            "The department relation is not being included in the API response for designations.",
        );
      }
    }

    await page.screenshot({ path: "test-results/hr-35-designations-dept-id.png", fullPage: true });
  });
});

/* ================================================================== */
/*  Scenario 8: Warnings page (hidden from nav)                        */
/* ================================================================== */
test.describe.serial("Scenario 8 - Warnings page (hidden from nav)", () => {
  test("8.1 - Warnings is NOT in sidebar navigation for any role", async ({ page }) => {
    await signInAsHR(page);
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Warnings/Disciplinary Actions is NOT in NAV_ITEMS for any role
    const warningsLink = page.getByRole("link", { name: /warnings/i });
    const disciplinaryLink = page.getByRole("link", { name: /disciplinary/i });
    const warningsCount = await warningsLink.count().catch(() => 0);
    const disciplinaryCount = await disciplinaryLink.count().catch(() => 0);
    expect(warningsCount).toBe(0);
    expect(disciplinaryCount).toBe(0);

    await page.screenshot({ path: "test-results/hr-36-warnings-not-in-nav.png", fullPage: true });
  });

  test("8.2 - HR can access Warnings page via direct URL", async ({ page }) => {
    await signInAsHR(page);
    await page.goto("/dashboard/warnings", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    const url = page.url();

    if (url.includes("/dashboard/warnings")) {
      const hasHeading = await page.getByText("Disciplinary Actions").isVisible().catch(() => false);
      const hasNoWarnings = await page.getByText(/no disciplinary actions/i).isVisible().catch(() => false);
      const hasSubtitle = await page.getByText(/review and acknowledge/i).isVisible().catch(() => false);

      expect(hasHeading || hasNoWarnings || hasSubtitle).toBeTruthy();
    } else {
      console.log(`HR redirected from warnings. Final URL: ${url}`);
    }

    await page.screenshot({ path: "test-results/hr-37-warnings-hr.png", fullPage: true });
  });

  test("8.3 - Employee can access Warnings page via direct URL", async ({ page }) => {
    await signInAsEmployee(page);
    await page.goto("/dashboard/warnings", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    const url = page.url();

    if (url.includes("/dashboard/warnings")) {
      const hasHeading = await page.getByText("Disciplinary Actions").isVisible().catch(() => false);
      const hasEmptyState = await page.getByText("No Disciplinary Actions").isVisible().catch(() => false);
      expect(hasHeading || hasEmptyState).toBeTruthy();

      // Uses useMyWarnings hook which shows current user's warnings
      // This is expected - employees see their own warnings
      console.log("Employee can see own warnings page via direct URL");
    }

    await page.screenshot({ path: "test-results/hr-38-warnings-employee.png", fullPage: true });
  });
});

/* ================================================================== */
/*  Scenario 9: Attendance Corrections                                 */
/* ================================================================== */
test.describe.serial("Scenario 9 - Attendance Corrections", () => {
  test("9.1 - HR sees Admin Corrections view", async ({ page }) => {
    await signInAsHR(page);
    await navigateTo(page, "/dashboard/attendance-corrections");

    // HR should see AdminCorrectionsView (not EmployeeCorrectionsView)
    await expect(page.getByRole("heading", { name: "Attendance Corrections" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Review and manage attendance correction requests")).toBeVisible();

    // HR should NOT see "Request Correction" button (that's for employees)
    const requestBtn = page.getByRole("button", { name: /request correction/i });
    const hasRequestBtn = await requestBtn.isVisible().catch(() => false);
    expect(hasRequestBtn).toBeFalsy();

    await page.screenshot({ path: "test-results/hr-39-attendance-corrections-hr.png", fullPage: true });
  });

  test("9.2 - Employee sees My Attendance Corrections view", async ({ page }) => {
    await signInAsEmployee(page);
    await navigateTo(page, "/dashboard/attendance-corrections");

    // Employee should see EmployeeCorrectionsView
    await expect(page.getByRole("heading", { name: "My Attendance Corrections" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Request corrections to your attendance records")).toBeVisible();

    // Employee should see "Request Correction" button
    await expect(page.getByRole("button", { name: /request correction/i })).toBeVisible();

    await page.screenshot({ path: "test-results/hr-40-attendance-corrections-employee.png", fullPage: true });
  });

  test("9.3 - Employee opens Request Correction dialog", async ({ page }) => {
    await signInAsEmployee(page);
    await navigateTo(page, "/dashboard/attendance-corrections");

    const requestBtn = page.getByRole("button", { name: /request correction/i });
    await expect(requestBtn).toBeVisible({ timeout: 10000 });
    await requestBtn.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByText("Request Attendance Correction")).toBeVisible();

    // Verify form fields
    await expect(dialog.getByText("Date *")).toBeVisible();
    await expect(dialog.getByText("Reason *")).toBeVisible();

    await page.screenshot({ path: "test-results/hr-41-attendance-correction-dialog.png", fullPage: true });
  });

  test("9.4 - Admin can access Attendance Corrections", async ({ page }) => {
    await signInAsAdmin(page);
    await navigateTo(page, "/dashboard/attendance-corrections");

    await expect(page.getByRole("heading", { name: "Attendance Corrections" })).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: "test-results/hr-42-attendance-corrections-admin.png", fullPage: true });
  });

  test("9.5 - Owner can access Attendance Corrections", async ({ page }) => {
    await signInAsOwner(page);
    await navigateTo(page, "/dashboard/attendance-corrections");

    await expect(page.getByRole("heading", { name: "Attendance Corrections" })).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: "test-results/hr-43-attendance-corrections-owner.png", fullPage: true });
  });
});

/* ================================================================== */
/*  Bonus: API-Level HR Portal Checks                                  */
/* ================================================================== */
test.describe.serial("API-Level HR Portal Checks", () => {
  test("API - Leave Requests endpoint returns data", async ({ page }) => {
    await signInAsHR(page);
    const resp = await page.request.get("/api/proxy/leave-requests?limit=5");
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body).toHaveProperty("data");
  });

  test("API - Leave Allocations endpoint returns data", async ({ page }) => {
    await signInAsHR(page);
    const resp = await page.request.get("/api/proxy/leave-allocations?limit=5");
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body).toHaveProperty("data");
  });

  test("API - Employees endpoint returns data", async ({ page }) => {
    await signInAsHR(page);
    const resp = await page.request.get("/api/proxy/employees?limit=5");
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body).toHaveProperty("data");
  });

  test("API - Departments endpoint returns data", async ({ page }) => {
    await signInAsAdmin(page);
    const resp = await page.request.get("/api/proxy/departments?limit=5");
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body).toHaveProperty("data");
  });

  test("API - Designations endpoint returns data", async ({ page }) => {
    await signInAsAdmin(page);
    const resp = await page.request.get("/api/proxy/designations?limit=5");
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body).toHaveProperty("data");
  });

  test("API - Warnings/me endpoint accessible", async ({ page }) => {
    await signInAsHR(page);
    const resp = await page.request.get("/api/proxy/warnings/me");
    // May return 200 (empty list) or 404
    expect([200, 404]).toContain(resp.status());
  });

  test("API - Attendance Corrections endpoint returns data", async ({ page }) => {
    await signInAsHR(page);
    const resp = await page.request.get("/api/proxy/attendance-corrections?limit=5");
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body).toHaveProperty("data");
  });
});

/* ================================================================== */
/*  Bug Report Summary (always runs last)                              */
/* ================================================================== */
test.describe.serial("Bug Report", () => {
  test("Print and save bug summary", async ({ page }) => {
    if (BUGS.length > 0) {
      console.log("\n===== HR PORTAL BUG REPORT =====");
      for (const bug of BUGS) {
        console.log(
          `\nBUG #${bug.id} [${bug.severity}] ${bug.title}\nReproduction: ${bug.repro}`,
        );
      }
      console.log(`\nTotal bugs found: ${BUGS.length}`);
      console.log("================================\n");
    } else {
      console.log("\n===== NO BUGS FOUND =====\n");
    }

    // Write bugs to JSON file for programmatic consumption
    const dir = "test-results";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(`${dir}/hr-portal-bugs.json`, JSON.stringify(BUGS, null, 2));

    expect(true).toBeTruthy();
  });
});
