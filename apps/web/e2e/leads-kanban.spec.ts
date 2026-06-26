import { expect, test } from "@playwright/test";
import { signInAsAdmin, signInAsEmployee, navigateTo } from "./helpers";

test.describe.serial("Leads Page — Table & Kanban Views", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page);
  });

  test("Leads page loads with table view by default", async ({ page }) => {
    await navigateTo(page, "/dashboard/leads");

    await expect(page.getByRole("heading", { name: "Leads" })).toBeVisible();

    await expect(page.getByRole("button", { name: /table/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /board/i })).toBeVisible();

    await expect(page.getByRole("button", { name: /add lead/i })).toBeVisible();
  });

  test("Leads summary cards show Open, Converted, Declined", async ({ page }) => {
    await navigateTo(page, "/dashboard/leads");

    await expect(page.getByText("Open")).toBeVisible();
    await expect(page.getByText("Converted").first()).toBeVisible();
    await expect(page.getByText("Declined")).toBeVisible();
  });

  test("Can toggle from Table to Board (Kanban) view", async ({ page }) => {
    await navigateTo(page, "/dashboard/leads");

    const boardBtn = page.getByRole("button", { name: /board/i });
    await boardBtn.click();

    await expect(page.getByText(/new/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/contacted/i)).toBeVisible();
  });

  test("Can toggle back from Board to Table view", async ({ page }) => {
    await navigateTo(page, "/dashboard/leads");

    await page.getByRole("button", { name: /board/i }).click();
    await expect(page.getByText(/new/i)).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: /table/i }).click();
    await expect(page.getByRole("heading", { name: "Leads" })).toBeVisible();
  });

  test("Add Lead dialog opens and shows form fields", async ({ page }) => {
    await navigateTo(page, "/dashboard/leads");

    await page.getByRole("button", { name: /add lead/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByText("Customer Name")).toBeVisible();
    await expect(dialog.getByText("Email")).toBeVisible();
    await expect(dialog.getByText("Phone")).toBeVisible();
    await expect(dialog.getByText("Source")).toBeVisible();
  });
});

test.describe.serial("Leads Page — Employee Access", () => {
  test("Employee can view leads page", async ({ page }) => {
    await signInAsEmployee(page);
    await navigateTo(page, "/dashboard/leads");

    await expect(page.getByRole("heading", { name: "Leads" })).toBeVisible();
  });
});
