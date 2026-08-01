/**
 * Global Setup — Pre-authenticate each role and save browser storage states.
 *
 * This runs ONCE before all tests. Each role signs in via NextAuth and the
 * resulting cookie/JWT state is saved to e2e/.auth/<role>.json. Tests then
 * load these via `test.use({ storageState })` so they start already
 * authenticated — no per-test sign-in required.
 */
import { chromium } from "@playwright/test";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

const BASE_URL = process.env.WEB_E2E_BASE_URL ?? "http://localhost:3000";
const AUTH_DIR = join(__dirname, ".auth");

const USERS: Array<{ name: string; email: string; password: string }> = [
  { name: "admin", email: "admin@company.com", password: "Admin@123" },
  { name: "owner", email: "owner@company.com", password: "Owner@123" },
  { name: "employee", email: "sales@company.com", password: "Sales@12345" },
  { name: "hr", email: "hr@company.com", password: "Hr@12345" },
  { name: "manager", email: "manager@company.com", password: "Manager@123" },
  { name: "accounts", email: "accounts@company.com", password: "Accounts@123" },
  { name: "fieldEmployee", email: "field@company.com", password: "Field@123" },
];

export default async function globalSetup() {
  if (!existsSync(AUTH_DIR)) {
    mkdirSync(AUTH_DIR, { recursive: true });
  }

  const browser = await chromium.launch();

  for (const user of USERS) {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto(`${BASE_URL}/sign-in`);

      const csrfResp = await page.request.get(`${BASE_URL}/api/auth/csrf`);
      const { csrfToken } = await csrfResp.json();

      const resp = await page.request.post(
        `${BASE_URL}/api/auth/callback/credentials`,
        {
          headers: { "X-Auth-Return-Redirect": "1" },
          form: {
            csrfToken,
            email: user.email,
            password: user.password,
            callbackUrl: "/dashboard",
          },
        },
      );

      if (!resp.ok()) {
        throw new Error(`Login returned HTTP ${resp.status()}`);
      }

      // Navigate to dashboard so the JWT session cookie is set
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForURL("**/dashboard**", { timeout: 15000 });

      const statePath = join(AUTH_DIR, `${user.name}.json`);
      await context.storageState({ path: statePath });
      console.log(`  global-setup: saved ${user.name} → ${statePath}`);
    } finally {
      await context.close();
    }
  }

  await browser.close();
}
