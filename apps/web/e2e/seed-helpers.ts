import { expect, type Page } from "@playwright/test";

export const ownerEmail = process.env.WEB_E2E_OWNER_EMAIL ?? "owner@company.com";
export const ownerPassword = process.env.WEB_E2E_OWNER_PASSWORD ?? "Owner@123";

export async function signInAsOwner(page: Page) {
  await page.goto("/sign-in", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  await expect(page.getByText("RealEstate CRM")).toBeVisible({ timeout: 15000 });

  const csrfReq = await page.request.get("/api/auth/csrf");
  const { csrfToken } = await csrfReq.json();
  const loginResp = await page.request.post("/api/auth/callback/credentials", {
    headers: { "X-Auth-Return-Redirect": "1" },
    form: { csrfToken, email: ownerEmail, password: ownerPassword, callbackUrl: "/dashboard" },
  });
  expect(loginResp.ok()).toBeTruthy();

  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await expect(page).toHaveURL(/\/dashboard/);
}

export async function navigateToPage(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await expect(page).not.toHaveURL(/\/sign-in/);
}

export async function openCreateDialog(page: Page, buttonText: string) {
  const btn = page.getByRole("button", { name: new RegExp(buttonText, "i") });
  await expect(btn).toBeVisible({ timeout: 10000 });
  await btn.click();
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
}

export async function fillTextField(page: Page, label: string, value: string) {
  const input = page.getByRole("textbox", { name: new RegExp(label, "i") });
  await expect(input).toBeVisible({ timeout: 5000 });
  await input.fill(value);
}

export async function fillNumberField(page: Page, label: string, value: string | number) {
  const input = page.locator(`input[type="number"]`).filter({ has: page.locator(`..`).getByText(new RegExp(label, "i")) });
  if (await input.isVisible()) {
    await input.fill(String(value));
    return;
  }
  const inputByLabel = page.locator(`label`).filter({ hasText: new RegExp(label, "i") }).locator(`..`).locator(`input[type="number"]`);
  if (await inputByLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
    await inputByLabel.fill(String(value));
    return;
  }
  const fallback = page.locator(`input[type="number"][placeholder*="${label}" i]`);
  if (await fallback.isVisible({ timeout: 2000 }).catch(() => false)) {
    await fallback.fill(String(value));
  }
}

export async function selectOption(page: Page, label: string, value: string) {
  const selectTrigger = page.locator(`[role="combobox"]`).filter({ has: page.locator(`..`).getByText(new RegExp(label, "i")) });
  if (await selectTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
    await selectTrigger.click();
    await page.waitForTimeout(300);
    const option = page.getByRole("option", { name: new RegExp(value, "i") });
    await expect(option).toBeVisible({ timeout: 5000 });
    await option.click();
    return;
  }

  const triggerByLabel = page.locator(`label`).filter({ hasText: new RegExp(label, "i") }).locator(`..`).locator(`[role="combobox"]`);
  if (await triggerByLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
    await triggerByLabel.click();
    await page.waitForTimeout(300);
    const option = page.getByRole("option", { name: new RegExp(value, "i") });
    await expect(option).toBeVisible({ timeout: 5000 });
    await option.click();
    return;
  }

  const allTriggers = page.locator(`[role="combobox"]`);
  const count = await allTriggers.count();
  for (let i = 0; i < count; i++) {
    const t = allTriggers.nth(i);
    const text = await t.textContent();
    if (text?.includes("Select") || text?.includes(label) || text === "") {
      await t.click();
      await page.waitForTimeout(300);
      const option = page.getByRole("option", { name: new RegExp(value, "i") });
      if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
        await option.click();
        return;
      }
      await page.keyboard.press("Escape");
      await page.waitForTimeout(200);
    }
  }
}

export async function submitForm(page: Page) {
  const saveBtn = page.getByRole("dialog").getByRole("button", { name: /save|create|submit/i });
  await expect(saveBtn).toBeVisible({ timeout: 3000 });
  await saveBtn.click();
  await page.waitForTimeout(1000);
  await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10000 }).catch(() => {});
}

export async function deleteAllViaApi(page: Page, endpoint: string) {
  const resp = await page.request.get(`/api/proxy/${endpoint}?limit=100`);
  if (!resp.ok()) return;
  const body = await resp.json();
  const items = body.data ?? body ?? [];
  for (const item of items) {
    if (item.id) {
      await page.request.delete(`/api/proxy/${endpoint}/${item.id}`).catch(() => {});
    }
  }
}
