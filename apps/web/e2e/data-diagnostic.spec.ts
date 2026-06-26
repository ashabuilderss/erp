import { expect, test } from "@playwright/test";
import { signInAsAdmin, signInAsOwner, signInAsEmployee, signInAsHR } from "./helpers";

test.describe("Data Diagnostic — What Each User Sees", () => {
  test("Admin: API data check", async ({ page }) => {
    await signInAsAdmin(page);

    const endpoints = [
      "/api/proxy/commissions",
      "/api/proxy/incentives",
      "/api/proxy/properties",
      "/api/proxy/leads",
      "/api/proxy/customers",
      "/api/proxy/vendors",
      "/api/proxy/construction-sites",
      "/api/proxy/materials",
      "/api/proxy/inventory",
      "/api/proxy/brokers",
      "/api/proxy/complaints",
      "/api/proxy/payroll-runs",
      "/api/proxy/attendance",
      "/api/proxy/employees",
      "/api/proxy/departments",
      "/api/proxy/designations",
    ];

    for (const ep of endpoints) {
      const resp = await page.request.get(ep);
      const status = resp.status();
      let dataLength = 0;
      try {
        const body = await resp.json();
        if (Array.isArray(body.data)) dataLength = body.data.length;
        else if (Array.isArray(body)) dataLength = body.length;
        else dataLength = Object.keys(body).length;
      } catch { dataLength = -1; }
      console.log(`  ${status} ${ep} → ${dataLength} items`);
      if (status === 200) expect(status).toBe(200);
    }
  });

  test("Owner: API data check", async ({ page }) => {
    await signInAsOwner(page);

    const endpoints = [
      "/api/proxy/commissions",
      "/api/proxy/incentives",
      "/api/proxy/properties",
      "/api/proxy/leads",
      "/api/proxy/permission-grants",
      "/api/proxy/companies",
    ];

    for (const ep of endpoints) {
      const resp = await page.request.get(ep);
      const status = resp.status();
      let dataLength = 0;
      try {
        const body = await resp.json();
        if (Array.isArray(body.data)) dataLength = body.data.length;
        else if (Array.isArray(body)) dataLength = body.length;
        else dataLength = Object.keys(body).length;
      } catch { dataLength = -1; }
      console.log(`  ${status} ${ep} → ${dataLength} items`);
    }
  });

  test("Employee (sales): API data check", async ({ page }) => {
    await signInAsEmployee(page);

    const endpoints = [
      "/api/proxy/commissions",
      "/api/proxy/incentives",
      "/api/proxy/leads",
      "/api/proxy/properties",
      "/api/proxy/attendance",
      "/api/proxy/eod-reports",
      "/api/proxy/payslips/me",
    ];

    for (const ep of endpoints) {
      const resp = await page.request.get(ep);
      const status = resp.status();
      let dataLength = 0;
      try {
        const body = await resp.json();
        if (Array.isArray(body.data)) dataLength = body.data.length;
        else if (Array.isArray(body)) dataLength = body.length;
        else dataLength = Object.keys(body).length;
      } catch { 
        const text = await resp.text();
        console.log(`  ${status} ${ep} → non-JSON: ${text.substring(0, 100)}`);
        continue;
      }
      console.log(`  ${status} ${ep} → ${dataLength} items`);
    }
  });

  test("HR Manager: API data check", async ({ page }) => {
    await signInAsHR(page);

    const endpoints = [
      "/api/proxy/employees",
      "/api/proxy/departments",
      "/api/proxy/leave-requests",
      "/api/proxy/leave-allocations",
      "/api/proxy/payroll-runs",
      "/api/proxy/attendance",
      "/api/proxy/activity-logs",
    ];

    for (const ep of endpoints) {
      const resp = await page.request.get(ep);
      const status = resp.status();
      let dataLength = 0;
      try {
        const body = await resp.json();
        if (Array.isArray(body.data)) dataLength = body.data.length;
        else if (Array.isArray(body)) dataLength = body.length;
        else dataLength = Object.keys(body).length;
      } catch { 
        const text = await resp.text();
        console.log(`  ${status} ${ep} → non-JSON: ${text.substring(0, 100)}`);
        continue;
      }
      console.log(`  ${status} ${ep} → ${dataLength} items`);
    }
  });
});
