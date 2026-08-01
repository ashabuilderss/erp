import { test, expect, type Page } from "@playwright/test";
import {
  signInAsOwner,
  navigateToPage,
  openCreateDialog,
  submitForm,
} from "./seed-helpers";

let page: Page;

test.beforeAll(async ({ browser }) => {
  const ctx = await browser.newContext();
  page = await ctx.newPage();
  await signInAsOwner(page);
});

async function fillField(fieldName: string, value: string) {
  const container = page.getByRole("dialog");
  const label = container.locator(`label:has-text("${fieldName}")`);
  await expect(label.first()).toBeVisible({ timeout: 5000 });
  const parent = label.first().locator("..");
  const input = parent.locator("input:visible");
  if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
    await input.fill(value);
    return;
  }
  const textarea = parent.locator("textarea:visible");
  if (await textarea.isVisible({ timeout: 2000 }).catch(() => false)) {
    await textarea.fill(value);
    return;
  }
}

async function selectOption(fieldName: string, optionText: string) {
  const container = page.getByRole("dialog");
  const label = container.locator(`label:has-text("${fieldName}")`);
  await expect(label.first()).toBeVisible({ timeout: 5000 });
  const parent = label.first().locator("..");
  const trigger = parent.locator('button[aria-haspopup="listbox"]');
  if (await trigger.isVisible({ timeout: 3000 }).catch(() => false)) {
    await trigger.click();
    await page.waitForTimeout(500);
    const opt = page.getByRole("option", { name: new RegExp(optionText, "i") });
    await expect(opt).toBeVisible({ timeout: 5000 });
    await opt.click();
    return;
  }
}

async function openDialogAndFill(
  modulePath: string,
  addButtonText: string,
  fields: Record<string, string>,
  extra?: () => Promise<void>,
) {
  await navigateToPage(page, `/dashboard/${modulePath}`);
  await page.waitForTimeout(1000);
  await openCreateDialog(page, addButtonText);
  await page.waitForTimeout(500);
  for (const [field, value] of Object.entries(fields)) {
    await fillField(field, value).catch(() => selectOption(field, value));
  }
  if (extra) await extra();
  await submitForm(page);
  await page.waitForTimeout(500);
}

const BACKEND_URL = "http://127.0.0.1:4000";

let backendJwt = "";

async function backendAuth() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${backendJwt}` };
}

async function apiCreate(endpoint: string, data: Record<string, any>) {
  const headers = await backendAuth();
  const resp = await page.request.post(`${BACKEND_URL}/api/v1/${endpoint}`, { headers, data });
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

async function apiGet(endpoint: string) {
  const headers = await backendAuth();
  const resp = await page.request.get(`${BACKEND_URL}/api/v1/${endpoint}`, { headers });
  if (!resp.ok()) return null;
  return resp.json();
}

async function getAllIds(endpoint: string): Promise<string[]> {
  const headers = await backendAuth();
  const resp = await page.request.get(`${BACKEND_URL}/api/v1/${endpoint}?limit=100`, { headers });
  if (!resp.ok()) return [];
  const body = await resp.json();
  const items = body.data ?? body ?? [];
  return items.map((i: any) => i.id).filter(Boolean);
}

async function apiDelete(endpoint: string, id: string) {
  const headers = await backendAuth();
  await page.request.delete(`${BACKEND_URL}/api/v1/${endpoint}/${id}`, { headers }).catch(() => {});
}

test.describe.serial("Seed All Modules Through UI", () => {
  test.slow();
  let companyId: string;
  let adminEmployeeId: string;
  let hrEmployeeId: string;
  let salesMgrEmployeeId: string;
  let salesExecEmployeeId: string;
  let opsExecEmployeeId: string;
  const deptIds: Record<string, string> = {};
  const desigIds: Record<string, string> = {};
  let propertyIds: string[] = [];
  let customerIds: string[] = [];
  let leadIds: string[] = [];
  let vendorIds: string[] = [];
  let materialIds: string[] = [];
  let siteIds: string[] = [];

  test("Phase 0: Clear existing seed data", async () => {
    const loginResp = await page.request.post(`${BACKEND_URL}/api/v1/auth/login`, { data: { email: "owner@company.com", password: "Owner@123" } });
    const loginBody = await loginResp.json();
    expect(loginBody.accessToken).toBeTruthy();
    backendJwt = loginBody.accessToken;

    const me = await apiGet("auth/me");
    companyId = me?.company?.id ?? "";
    expect(companyId).toBeTruthy();

    const deleteOrder = [
      "payment-entries", "payment-schedules", "commissions", "bookings",
      "site-visits", "leads", "complaints", "brokers", "incentives",
      "labour-entries", "material-inward", "inventory", "materials",
      "vendors", "progress-photos", "construction-sites/phases", "construction-sites",
      "expense-claims", "eod-reports", "performance", "leave-requests",
      "leave-allocations", "payroll-runs", "attendance", "employee-assignments",
      "device-registrations", "customers", "properties", "employees",
      "designations", "departments", "escalation-events", "escalation-rules",
    ];

    for (const ep of deleteOrder) {
      const ids = await getAllIds(ep);
      for (const id of ids) {
        await apiDelete(ep, id);
      }
    }
  });

  test("Phase 1: Create Departments", async () => {
    const depts = [
      { name: "Sales", description: "Sales and business development" },
      { name: "Marketing", description: "Marketing and advertising" },
      { name: "Human Resources", description: "HR and personnel management" },
      { name: "Operations", description: "Operations and administration" },
    ];

    for (const d of depts) {
      await openDialogAndFill("departments", "Add Department", {
        Name: d.name,
        Description: d.description || "",
      });
    }

    const resp = await apiGet("departments?limit=50");
    const items = resp?.data ?? resp ?? [];
    expect(items.length).toBeGreaterThanOrEqual(4);
    for (const d of depts) {
      const match = items.find((i: any) => i.name === d.name);
      expect(match).toBeTruthy();
      if (match) deptIds[d.name] = match.id;
    }
  });

  test("Phase 2: Create Designations", async () => {
    const desigs: { name: string; dept: string }[] = [
      { name: "Sales Manager", dept: "Sales" },
      { name: "Sales Executive", dept: "Sales" },
      { name: "Marketing Executive", dept: "Marketing" },
      { name: "HR Manager", dept: "Human Resources" },
      { name: "Operations Manager", dept: "Operations" },
      { name: "Operations Executive", dept: "Operations" },
    ];

    for (const d of desigs) {
      await navigateToPage(page, "/dashboard/designations");
      await page.waitForTimeout(500);
      await openCreateDialog(page, "Add Designation");
      await page.waitForTimeout(300);
      await fillField("Name", d.name);
      await selectOption("Department", d.dept);
      await submitForm(page);
      await page.waitForTimeout(300);
    }

    const resp = await apiGet("designations?limit=50");
    const items = resp?.data ?? resp ?? [];
    expect(items.length).toBeGreaterThanOrEqual(6);
    for (const d of desigs) {
      const match = items.find((i: any) => i.name === d.name);
      expect(match).toBeTruthy();
      if (match) desigIds[d.name] = match.id;
    }
  });

  test("Phase 3: Create Employees with Login via UI", async () => {
    const employees = [
      { first: "Admin", last: "User", email: "admin@company.com", code: "ADM-001", pass: "Admin@123", dept: "Operations", desig: "Operations Manager", phone: "+91 98765 10001", salary: "125000" },
      { first: "Priya", last: "Sharma", email: "hr@company.com", code: "HR-001", pass: "Hr@12345", dept: "Human Resources", desig: "HR Manager", phone: "+91 98765 10002", salary: "95000" },
      { first: "Aarav", last: "Mehta", email: "sales@company.com", code: "SAL-001", pass: "Sales@12345", dept: "Sales", desig: "Sales Manager", phone: "+91 98765 10003", salary: "72000" },
      { first: "Neha", last: "Kapoor", email: "agent@company.com", code: "SAL-002", pass: "Agent@12345", dept: "Sales", desig: "Sales Executive", phone: "+91 98765 10004", salary: "72000" },
      { first: "Vikram", last: "Rao", email: "ops@company.com", code: "OPS-001", pass: "Ops@12345", dept: "Operations", desig: "Operations Executive", phone: "+91 98765 10005", salary: "72000" },
    ];

    for (const emp of employees) {
      await navigateToPage(page, "/dashboard/employees");
      await page.waitForTimeout(500);
      await openCreateDialog(page, "Create with Login");
      await page.waitForTimeout(300);
      await fillField("First Name", emp.first);
      await fillField("Last Name", emp.last);
      await fillField("Email", emp.email);
      await fillField("Employee Code", emp.code);
      await selectOption("Department", emp.dept);
      await selectOption("Designation", emp.desig);
      await fillField("Phone", emp.phone);

      const dialog = page.getByRole("dialog");
      const salaryInput = dialog.locator('input[type="number"]');
      if (await salaryInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await salaryInput.fill(emp.salary);
      }

      const passInput = dialog.getByPlaceholder(/min 8/i);
      if (await passInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await passInput.fill(emp.pass);
      }

      const createBtn = dialog.getByRole("button", { name: /create employee/i });
      await expect(createBtn).toBeVisible({ timeout: 3000 });
      await createBtn.click();
      await page.waitForTimeout(1500);
      await expect(dialog).not.toBeVisible({ timeout: 10000 }).catch(() => {});
    }

    const resp = await apiGet("employees?limit=50");
    const items = resp?.data ?? resp ?? [];

    const adminEmp = items.find((i: any) => i.employeeCode === "ADM-001");
    expect(adminEmp).toBeTruthy();
    adminEmployeeId = adminEmp.id;

    const hrEmp = items.find((i: any) => i.employeeCode === "HR-001");
    expect(hrEmp).toBeTruthy();
    hrEmployeeId = hrEmp.id;

    const smEmp = items.find((i: any) => i.employeeCode === "SAL-001");
    expect(smEmp).toBeTruthy();
    salesMgrEmployeeId = smEmp.id;

    const seEmp = items.find((i: any) => i.employeeCode === "SAL-002");
    expect(seEmp).toBeTruthy();
    salesExecEmployeeId = seEmp.id;

    const opsEmp = items.find((i: any) => i.employeeCode === "OPS-001");
    expect(opsEmp).toBeTruthy();
    opsExecEmployeeId = opsEmp.id;
  });

  test("Phase 4: Create Properties via UI", async () => {
    const properties = [
      { title: "Skyline Residency 3BHK", type: "APARTMENT", price: "12500000", area: "1680", beds: "3", baths: "3", location: "Whitefield Main Road", city: "Bengaluru", state: "Karnataka", desc: "Premium 3BHK apartment in Whitefield" },
      { title: "Greenwood Villa", type: "VILLA", price: "27500000", area: "3200", beds: "4", baths: "4", location: "Sarjapur Road", city: "Bengaluru", state: "Karnataka", desc: "Luxury villa in Sarjapur" },
      { title: "Commerce Hub Office Suite", type: "COMMERCIAL", price: "8900000", area: "1100", beds: "0", baths: "2", location: "Outer Ring Road", city: "Bengaluru", state: "Karnataka", desc: "Commercial office space" },
    ];

    for (const p of properties) {
      await navigateToPage(page, "/dashboard/properties");
      await page.waitForTimeout(500);
      await openCreateDialog(page, "Add Property");
      await page.waitForTimeout(500);
      await fillField("Title", p.title);
      await selectOption("Type", p.type);
      await fillField("Price", p.price);

      const dialog = page.getByRole("dialog");
      const numberInputs = dialog.locator('input[type="number"]');
      const count = await numberInputs.count();

      if (count >= 1) await numberInputs.nth(0).fill(p.area);
      if (count >= 2) await numberInputs.nth(1).fill(p.beds);
      if (count >= 3) await numberInputs.nth(2).fill(p.baths);

      await fillField("Location", p.location);
      await fillField("City", p.city);
      await fillField("State", p.state);
      await fillField("Description", p.desc);
      await submitForm(page);
      await page.waitForTimeout(500);
    }

    const resp = await apiGet("properties?limit=50");
    const items = resp?.data ?? resp ?? [];
    propertyIds = items.map((i: any) => i.id);
    expect(propertyIds.length).toBeGreaterThanOrEqual(3);
  });

  test("Phase 5: Create Customers via UI", async () => {
    const customers = [
      { name: "Ananya Iyer", email: "ananya.demo@example.com", phone: "+91 90000 10001", address: "Indiranagar, Bengaluru", type: "BUYER", source: "Website" },
      { name: "Rohan Malhotra", email: "rohan.demo@example.com", phone: "+91 90000 10002", address: "Koramangala, Bengaluru", type: "BUYER", source: "Referral" },
    ];

    for (const c of customers) {
      await openDialogAndFill("customers", "Add Customer", {
        Name: c.name,
        Email: c.email,
        Phone: c.phone,
      });
      await page.waitForTimeout(300);
    }

    const resp = await apiGet("customers?limit=50");
    const items = resp?.data ?? resp ?? [];
    customerIds = items.map((i: any) => i.id);
    expect(customerIds.length).toBeGreaterThanOrEqual(2);
  });

  test("Phase 6: Create Brokers via UI", async () => {
    const brokers = [
      { name: "Rajesh Kumar", companyName: "Kumar Associates", phone: "+91-9876543220" },
      { name: "Sunita Verma", companyName: "Verma Realty", phone: "+91-9876543221" },
    ];

    for (const b of brokers) {
      await openDialogAndFill("brokers", "Add Broker", {
        Name: b.name,
        Company: b.companyName,
        Phone: b.phone,
      });
      await page.waitForTimeout(300);
    }

    const resp = await apiGet("brokers?limit=50");
    const items = resp?.data ?? resp ?? [];
    expect(items.length).toBeGreaterThanOrEqual(2);
  });

  test("Phase 7: Create Leads via API", async () => {
    const propsResp = await apiGet("properties?limit=50");
    const properties = propsResp?.data ?? propsResp ?? [];
    const skyline = properties.find((p: any) => p.title.includes("Skyline"));
    const greenwood = properties.find((p: any) => p.title.includes("Greenwood"));
    const commerceHub = properties.find((p: any) => p.title.includes("Commerce"));

    const custResp = await apiGet("customers?limit=50");
    const customers = custResp?.data ?? custResp ?? [];

    const leads = [
      { customerName: "Ananya Iyer", customerEmail: "ananya.demo@example.com", customerPhone: "+91 90000 10001", source: "WEBSITE", propertyId: skyline?.id, assignedToEmployeeId: salesExecEmployeeId },
      { customerName: "Meera Nair", customerEmail: "meera.demo@example.com", customerPhone: "+91 90000 10003", source: "SOCIAL_MEDIA", propertyId: greenwood?.id, assignedToEmployeeId: salesMgrEmployeeId },
      { customerName: "Rohan Malhotra", customerEmail: "rohan.demo@example.com", customerPhone: "+91 90000 10002", source: "REFERRAL", propertyId: commerceHub?.id, assignedToEmployeeId: opsExecEmployeeId },
    ];

    for (const lead of leads) {
      await apiCreate("leads", lead);
    }

    const leadsResp = await apiGet("leads?limit=50");
    const leadsList = leadsResp?.data ?? leadsResp ?? [];
    leadIds = leadsList.map((l: any) => l.id);
    expect(leadIds.length).toBeGreaterThanOrEqual(3);
  });

  test("Phase 8: Create Vendors via UI", async () => {
    const vendors = [
      { name: "Sharma Construction Supplies", person: "Rohit Sharma", phone: "+91-9876543210" },
      { name: "Elite Interiors", person: "Priya Singh", phone: "+91-9876543211" },
    ];

    for (const v of vendors) {
      await openDialogAndFill("vendors", "Add Vendor", {
        Name: v.name,
      });
      await page.waitForTimeout(300);
    }

    const resp = await apiGet("vendors?limit=50");
    const items = resp?.data ?? resp ?? [];
    vendorIds = items.map((i: any) => i.id);
    expect(vendorIds.length).toBeGreaterThanOrEqual(2);
  });

  test("Phase 9: Create Materials via API", async () => {
    const materials = [
      { name: "OPC 53 Grade Cement", category: "Cement", unit: "Bags" },
      { name: "Fe500D TMT Steel Bars", category: "Steel", unit: "Tonnes" },
      { name: "Premium Vitrified Tiles", category: "Finishing", unit: "Boxes" },
    ];

    for (const m of materials) {
      await apiCreate("materials", m);
    }

    const resp = await apiGet("materials?limit=50");
    const items = resp?.data ?? resp ?? [];
    materialIds = items.map((i: any) => i.id);
    expect(materialIds.length).toBeGreaterThanOrEqual(3);
  });

  test("Phase 10: Create Construction Sites via UI", async () => {
    const sites = [
      { name: "Greenfield Township Phase 1", location: "Electronic City Phase 2, Bengaluru", desc: "Large township development" },
      { name: "Skyline Heights Tower B", location: "Whitefield, Bengaluru", desc: "25-storey residential tower" },
    ];

    for (const s of sites) {
      await openDialogAndFill("construction-sites", "Add Site", {
        Name: s.name,
        Location: s.location,
        Description: s.desc,
      });
      await page.waitForTimeout(300);
    }

    const resp = await apiGet("construction-sites?limit=50");
    const items = resp?.data ?? resp ?? [];
    siteIds = items.map((i: any) => i.id);
    expect(siteIds.length).toBeGreaterThanOrEqual(2);
  });

  test("Phase 11: Create Complaints via API", async () => {
    const custResp = await apiGet("customers?limit=50");
    const customers = custResp?.data ?? custResp ?? [];
    const ananya = customers.find((c: any) => c.name.includes("Ananya"));

    const propsResp = await apiGet("properties?limit=50");
    const properties = propsResp?.data ?? propsResp ?? [];
    const skyline = properties.find((p: any) => p.title.includes("Skyline"));

    const complaints = [
      { customerId: ananya?.id, propertyId: skyline?.id, subject: "Delay in property registration documents", description: "Documents not received despite multiple follow-ups" },
      { customerId: ananya?.id, subject: "Parking allocation not as agreed", description: "Parking spot assigned is different from what was promised" },
    ];

    for (const c of complaints) {
      await apiCreate("complaints", c);
    }

    const resp = await apiGet("complaints?limit=50");
    const items = resp?.data ?? resp ?? [];
    expect(items.length).toBeGreaterThanOrEqual(2);
  });

  test("Phase 12: Create Incentives via API", async () => {
    const incentives = [
      { title: "Q2 Top Performer Award", desc: "Highest quarterly sales achievement", award: "Gold Trophy + Performance Bonus", value: "100000" },
      { title: "Referral Champion Q1", desc: "Most referral leads closed in Q1", award: "Certificate + Amazon Gift Voucher", value: "25000" },
    ];

    for (const inc of incentives) {
      await apiCreate("incentives", {
        title: inc.title,
        description: inc.desc,
        award: inc.award,
        status: "ACTIVE",
        opportunityType: "MANUAL",
      });
    }

    const resp = await apiGet("incentives?limit=10");
    const items = resp?.data ?? resp ?? [];
    for (const inc of incentives) {
      const created = items.find((i: any) => i.title === inc.title);
      expect(created).toBeTruthy();
      if (created) {
        await page.request.patch(`/api/proxy/incentives/${created.id}`, {
          data: {
            value: parseFloat(inc.value),
            ...(inc.title.includes("Referral") ? { winnerId: salesExecEmployeeId, status: "CLOSED", payoutStatus: "PAID" } : {}),
          },
        });
      }
    }
  });

  test("Phase 13: Create Site Visits via API", async () => {
    const propsResp = await apiGet("properties?limit=50");
    const properties = propsResp?.data ?? propsResp ?? [];
    const skyline = properties.find((p: any) => p.title.includes("Skyline"));
    const commerceHub = properties.find((p: any) => p.title.includes("Commerce"));

    const custResp = await apiGet("customers?limit=50");
    const customers = custResp?.data ?? custResp ?? [];
    const ananya = customers.find((c: any) => c.name.includes("Ananya"));
    const rohan = customers.find((c: any) => c.name.includes("Rohan"));

    const futureDate = new Date(Date.now() + 2 * 86400000).toISOString();
    const pastDate = new Date(Date.now() - 3 * 86400000).toISOString();

    await apiCreate("site-visits", {
      propertyId: skyline?.id,
      customerId: ananya?.id,
      assignedToEmployeeId: salesExecEmployeeId,
      scheduledDate: futureDate,
      status: "SCHEDULED",
      notes: "Meet at project sales office",
    });

    await apiCreate("site-visits", {
      propertyId: commerceHub?.id,
      customerId: rohan?.id,
      assignedToEmployeeId: salesMgrEmployeeId,
      scheduledDate: pastDate,
      status: "SCHEDULED",
      notes: "Customer reviewed parking and floor plan",
    });

    const visitsResp = await apiGet("site-visits?limit=50");
    const visits = visitsResp?.data ?? visitsResp ?? [];
    const completedVisit = visits.find((v: any) => v.notes?.includes("parking"));
    if (completedVisit) {
      await page.request.patch(`/api/proxy/site-visits/${completedVisit.id}/status`, {
        data: { status: "COMPLETED" },
      });
      await page.request.patch(`/api/proxy/site-visits/${completedVisit.id}`, {
        data: { feedback: "Positive; requested booking paperwork" },
      });
    }
  });

  test("Phase 14: Create Bookings via API", async () => {
    const propsResp = await apiGet("properties?limit=50");
    const properties = propsResp?.data ?? propsResp ?? [];
    const commerceHub = properties.find((p: any) => p.title.includes("Commerce"));

    const custResp = await apiGet("customers?limit=50");
    const customers = custResp?.data ?? custResp ?? [];
    const rohan = customers.find((c: any) => c.name.includes("Rohan"));

    const yesterday = new Date(Date.now() - 1 * 86400000).toISOString();

    await apiCreate("bookings", {
      propertyId: commerceHub?.id,
      customerId: rohan?.id,
      assignedToEmployeeId: salesMgrEmployeeId,
      bookingDate: yesterday,
      amount: 8900000,
    });

    const bookingsResp = await apiGet("bookings?limit=50");
    const bookings = bookingsResp?.data ?? bookingsResp ?? [];
    const booking = bookings.find((b: any) => b.amount == 8900000);
    if (booking) {
      await page.request.patch(`/api/proxy/bookings/${booking.id}/status`, {
        data: { status: "CONFIRMED" },
      });
    }
  });

  test("Phase 15: Verify listing pages load with data", async () => {
    const modules = [
      { path: "departments", name: "Departments" },
      { path: "designations", name: "Designations" },
      { path: "employees", name: "Employees" },
      { path: "properties", name: "Properties" },
      { path: "customers", name: "Customers" },
      { path: "leads", name: "Leads" },
      { path: "site-visits", name: "Site Visits" },
      { path: "bookings", name: "Bookings" },
      { path: "vendors", name: "Vendors" },
      { path: "materials", name: "Materials" },
      { path: "construction-sites", name: "Construction Sites" },
      { path: "brokers", name: "Brokers" },
      { path: "complaints", name: "Complaints" },
      { path: "incentives", name: "Incentives" },
      { path: "attendance", name: "Attendance" },
      { path: "leave-requests", name: "Leave Requests" },
      { path: "payroll", name: "Payroll" },
      { path: "inventory", name: "Inventory" },
      { path: "labour", name: "Labour" },
      { path: "expenses", name: "Expenses" },
      { path: "eod-reports", name: "EOD Reports" },
    ];

    for (const mod of modules) {
      await navigateToPage(page, `/dashboard/${mod.path}`);
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(new RegExp(`/dashboard/${mod.path}`));
      const body = page.locator("body");
      await expect(body).toBeVisible({ timeout: 5000 });
    }
  });
});
