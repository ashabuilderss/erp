import { expect, test } from "@playwright/test";
import { signInAsOwner, ownerEmail, ownerPassword } from "./seed-helpers";

test("debug proxy auth", async ({ page }) => {
  // Sign in via NextAuth
  await signInAsOwner(page);

  // Check cookies in browser context
  const cookies = await page.context().cookies();
  console.log("All cookies:", JSON.stringify(cookies.map(c => ({ name: c.name, length: c.value.length }))));

  const sessionCookie = cookies.find(c => c.name.includes("session"));
  console.log("Session cookie:", sessionCookie?.name, "len:", sessionCookie?.value.length);

  // Make a proxy request via Playwright's API (sends same cookies)
  const proxyResp = await page.request.get("/api/proxy/departments?limit=5");
  console.log("Proxy status:", proxyResp.status());
  const proxyBody = await proxyResp.text();
  console.log("Proxy body:", proxyBody.substring(0, 500));

  // Also make the request directly from browser JavaScript
  const browserResp = await page.evaluate(async () => {
    const res = await fetch("/api/proxy/departments?limit=5", { credentials: "include" });
    return { status: res.status, body: await res.text() };
  });
  console.log("Browser fetch status:", browserResp.status);
  console.log("Browser fetch body:", browserResp.body.substring(0, 500));
});
