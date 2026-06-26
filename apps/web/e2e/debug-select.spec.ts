import { test, expect } from "@playwright/test";
import { signInAsOwner } from "./seed-helpers";

test("Debug site-visits page rendering", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", msg => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("response", resp => {
    if (resp.url().includes("/api/auth/session")) {
      console.log(`Session response: ${resp.status()}`);
    }
  });

  await signInAsOwner(page);
  
  // Full navigation to site-visits
  const resp = await page.goto("/dashboard/site-visits", { waitUntil: "load" });
  console.log("Navigation URL:", page.url(), "Status:", resp?.status());

  // Wait for content - check every second for 30 seconds
  for (let i = 0; i < 30; i++) {
    const hasNext = await page.evaluate(() => !!document.getElementById("__next"));
    const bodyLen = await page.evaluate(() => document.body.children.length);
    const hasSession = await page.evaluate(() => {
      try {
        return !!(window as any).__NEXT_AUTH?.session;
      } catch { return "error"; }
    });
    const text = await page.evaluate(() => document.body.innerText?.substring(0, 200));
    if (text?.trim()) {
      console.log(`Found content at ${i}s:`, text?.substring(0, 100));
      break;
    }
    console.log(`Second ${i}: __next=${hasNext} bodyLen=${bodyLen} text="${text?.substring(0, 50)}" hasSession=${hasSession}`);
    await page.waitForTimeout(1000);
  }

  const text = await page.evaluate(() => document.body.innerText);
  console.log("Final page text:", text?.substring(0, 500));
  
  if (errors.length > 0) {
    console.log("=== Console errors ===");
    errors.forEach(e => console.log(e));
  }
  
  await page.screenshot({ path: "debug-after-wait.png" });
});
