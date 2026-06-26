import { expect, test } from "@playwright/test";
import { signInAsAdmin, signInAsOwner, signInAsHR, signInAsEmployee, navigateTo } from "./helpers";

test.describe.serial("Approvals Page — Admin/Owner Access", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page);
  });

  test("Approvals page loads with 'Approval Center' heading", async ({ page }) => {
    await navigateTo(page, "/dashboard/approvals");

    await expect(page.getByRole("heading", { name: "Approval Center" })).toBeVisible();
    await expect(page.getByText("Review and manage pending approvals")).toBeVisible();
  });

  test("Leave Requests section is visible", async ({ page }) => {
    await navigateTo(page, "/dashboard/approvals");

    await expect(page.getByRole("heading", { name: "Leave Requests" })).toBeVisible();
  });

  test("Attendance Corrections section is visible for admin", async ({ page }) => {
    await navigateTo(page, "/dashboard/approvals");

    await expect(page.getByRole("heading", { name: "Attendance Corrections" })).toBeVisible();
  });

  test("Employee Approvals section is visible for admin", async ({ page }) => {
    await navigateTo(page, "/dashboard/approvals");

    await expect(page.getByRole("heading", { name: "Employee Approvals" })).toBeVisible();
  });

  test("Employee Approvals shows Pending/Active toggle", async ({ page }) => {
    await navigateTo(page, "/dashboard/approvals");

    await expect(page.getByRole("button", { name: "Pending" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Active" }).first()).toBeVisible();
  });
});

test.describe.serial("Approvals Page — Owner Access", () => {
  test("Owner can access approvals page", async ({ page }) => {
    await signInAsOwner(page);
    await navigateTo(page, "/dashboard/approvals");

    await expect(page.getByRole("heading", { name: "Approval Center" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Leave Requests" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Attendance Corrections" })).toBeVisible();
  });
});

test.describe.serial("Approvals Page — HR Access", () => {
  test("HR can access approvals page", async ({ page }) => {
    await signInAsHR(page);
    await navigateTo(page, "/dashboard/approvals");

    await expect(page.getByRole("heading", { name: "Approval Center" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Leave Requests" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Attendance Corrections" })).toBeVisible();
  });
});

test.describe.serial("Approvals Page — Employee Access", () => {
  test("Employee cannot see approval actions", async ({ page }) => {
    await signInAsEmployee(page);
    await navigateTo(page, "/dashboard/approvals");

    await expect(page.getByRole("heading", { name: "Approval Center" })).toBeVisible();

    const approveButtons = page.getByRole("button", { name: /approve/i });
    const count = await approveButtons.count();
    expect(count).toBe(0);
  });
});
