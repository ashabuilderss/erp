import { expect, test } from "@playwright/test";
import { adminEmail, adminPassword, signInAsAdmin } from "./helpers";

test("redirects unauthenticated dashboard requests to sign in", async ({ page }) => {
  await page.goto("/dashboard/properties");

  await expect(page).toHaveURL(/\/sign-in/);
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
});

test("rejects invalid credentials without leaving sign in", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByLabel("Email")).toBeVisible();

  // Fetch CSRF and submit invalid credentials via the API
  const csrfReq = await page.request.get("/api/auth/csrf");
  const { csrfToken } = await csrfReq.json();

  const resp = await page.request.post("/api/auth/callback/credentials", {
    headers: { "X-Auth-Return-Redirect": "1" },
    form: {
      csrfToken,
      email: adminEmail,
      password: `${adminPassword}-wrong`,
      callbackUrl: "/dashboard",
    },
  });

  // The API should return a 200 with an error URL
  const body = await resp.json();
  expect(resp.ok()).toBeTruthy();
  expect(body.url).toBeDefined();
  expect(body.url).toContain("error");

  // User should remain on sign-in page
  await expect(page).toHaveURL(/\/sign-in/);
});

test("rejects browser-supplied identity fields without verified credentials", async ({ page }) => {
  const csrfReq = await page.request.get("/api/auth/csrf");
  const { csrfToken } = await csrfReq.json();

  await page.request.post("/api/auth/callback/credentials", {
    headers: { "X-Auth-Return-Redirect": "1" },
    form: {
      csrfToken,
      id: "attacker-selected-user-id",
      email: "owner@company.com",
      firstName: "Fake",
      lastName: "Owner",
      role: "OWNER",
      companyId: "attacker-selected-company-id",
      callbackUrl: "/dashboard",
    },
  });

  const sessionResponse = await page.request.get("/api/auth/session");
  const session = await sessionResponse.json();
  expect(session?.user).toBeUndefined();
});

test("signs in and renders the admin dashboard", async ({ page }) => {
  await signInAsAdmin(page);

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText("Total Properties").first()).toBeVisible({ timeout: 10000 });
});

test("redirects to sign-in when accessing HR dashboard after logging out", async ({ page }) => {
  await signInAsAdmin(page);

  // Clear all session cookies directly
  const context = page.context();
  await context.clearCookies();

  // Navigate to dashboard — should redirect to sign-in
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in/);
});
