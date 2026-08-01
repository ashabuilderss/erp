import { expect, type Page } from "@playwright/test";

export const adminEmail = process.env.WEB_E2E_ADMIN_EMAIL ?? "admin@company.com";
export const adminPassword = process.env.WEB_E2E_ADMIN_PASSWORD ?? "Admin@123";
export const ownerEmail = process.env.WEB_E2E_OWNER_EMAIL ?? "owner@company.com";
export const ownerPassword = process.env.WEB_E2E_OWNER_PASSWORD ?? "Owner@123";
export const hrEmail = process.env.WEB_E2E_HR_EMAIL ?? "hr@company.com";
export const hrPassword = process.env.WEB_E2E_HR_PASSWORD ?? "Hr@12345";
export const empEmail = process.env.WEB_E2E_EMP_EMAIL ?? "sales@company.com";
export const empPassword = process.env.WEB_E2E_EMP_PASSWORD ?? "Sales@12345";
export const accountsEmail = process.env.WEB_E2E_ACCOUNTS_EMAIL ?? "accounts@company.com";
export const accountsPassword = process.env.WEB_E2E_ACCOUNTS_PASSWORD ?? "Accounts@123";
export const managerEmail = process.env.WEB_E2E_MANAGER_EMAIL ?? "manager@company.com";
export const managerPassword = process.env.WEB_E2E_MANAGER_PASSWORD ?? "Manager@123";
export const teamLeadEmail = process.env.WEB_E2E_TEAMLEAD_EMAIL ?? "teamlead@company.com";
export const teamLeadPassword = process.env.WEB_E2E_TEAMLEAD_PASSWORD ?? "Teamlead@123";
export const fieldEmpEmail = process.env.WEB_E2E_FIELDEMP_EMAIL ?? "field@company.com";
export const fieldEmpPassword = process.env.WEB_E2E_FIELDEMP_PASSWORD ?? "Field@123";

export async function signInAs(page: Page, email: string, password: string) {
  // Fast path: if already on dashboard with valid session, skip re-auth
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  if (!/\/sign-in/.test(page.url())) {
    return;
  }

  await page.goto("/sign-in");
  await expect(page.getByText("RealEstate CRM")).toBeVisible();

  const csrfReq = await page.request.get("/api/auth/csrf");
  const { csrfToken } = await csrfReq.json();

  const loginResp = await page.request.post("/api/auth/callback/credentials", {
    headers: { "X-Auth-Return-Redirect": "1" },
    form: { csrfToken, email, password, callbackUrl: "/dashboard" },
  });
  expect(loginResp.ok()).toBeTruthy();

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard/);
}

export async function signInAsAdmin(page: Page) {
  await signInAs(page, adminEmail, adminPassword);
}

export async function signInAsOwner(page: Page) {
  await signInAs(page, ownerEmail, ownerPassword);
}

export async function signInAsHR(page: Page) {
  await signInAs(page, hrEmail, hrPassword);
}

export async function signInAsEmployee(page: Page) {
  await signInAs(page, empEmail, empPassword);
}

export async function signInAsAccounts(page: Page) {
  await signInAs(page, accountsEmail, accountsPassword);
}

export async function signInAsManager(page: Page) {
  await signInAs(page, managerEmail, managerPassword);
}

export async function signInAsTeamLead(page: Page) {
  await signInAs(page, teamLeadEmail, teamLeadPassword);
}

export async function signInAsFieldEmployee(page: Page) {
  await signInAs(page, fieldEmpEmail, fieldEmpPassword);
}

export async function navigateTo(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  // Ensure we landed on the expected page (not redirected to sign-in)
  await expect(page).not.toHaveURL(/\/sign-in/);
}
