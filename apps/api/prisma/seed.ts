import "dotenv/config";
import {
  PrismaClient,
  UserRole,
  SiteStatus,
  SitePhaseStatus,
  PropertyStatus,
  PropertyType,
  LeadStatus,
  LeadSource,
  TaskCategory,
  TaskPriority,
  TaskStatus,
  LeaveType,
  LeaveStatus,
  WarningCategory,
  WarningSeverity,
  MeetingStatus,
  AssetStatus,
  AgreementType,
  AgreementStatus,
  CustomerType,
  ApprovalStatus,
} from "@prisma/client";
import { seedRbac } from "./seed-rbac";
import * as bcrypt from "bcrypt";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@127.0.0.1:5433/realestate_crm";
const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@company.com";
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin@123";
const BCRYPT_ROUNDS = 10;

const pool = new pg.Pool({ connectionString: DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const COMPANY_ID = "comp-asha-1";
const PASSWORD_HASH = bcrypt.hash(SEED_ADMIN_PASSWORD, BCRYPT_ROUNDS);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("Starting ASHA Builders seed...");
  console.log(`Admin email: ${SEED_ADMIN_EMAIL}`);

  // ── Cleanup ──────────────────────────────────────────────
  console.log("Cleaning existing data...");
  await prisma.$executeRawUnsafe(
    "TRUNCATE TABLE companies CASCADE",
  );
  console.log("  Truncated all tables via company cascade.");

  // ── Company ──────────────────────────────────────────────
  console.log("Creating company...");
  const company = await prisma.company.create({
    data: {
      id: COMPANY_ID,
      name: "ASHA Builders",
      slug: "asha-builders",
      gstin: "07AABCA1234C1Z5",
      pan: "AABCA1234C",
    },
  });

  // ── Departments ──────────────────────────────────────────
  console.log("Creating departments...");
  const deptData = [
    { name: "Operations", description: "Core operations and project management" },
    { name: "Sales", description: "Sales and business development" },
    { name: "Human Resources", description: "HR, recruitment, and employee relations" },
    { name: "Finance", description: "Accounting, payroll, and financial operations" },
    { name: "Construction", description: "Site work, engineering, and construction" },
    { name: "IT", description: "Information technology and systems" },
  ];
  const departments: Record<string, { id: string }> = {};
  for (const d of deptData) {
    const dept = await prisma.department.create({
      data: { companyId: COMPANY_ID, ...d },
    });
    departments[d.name] = dept;
  }

  // ── Designations ─────────────────────────────────────────
  console.log("Creating designations...");
  const desigData = [
    { name: "General Manager", dept: "Operations" },
    { name: "Sales Manager", dept: "Sales" },
    { name: "Sales Executive", dept: "Sales" },
    { name: "HR Manager", dept: "Human Resources" },
    { name: "Operations Manager", dept: "Operations" },
    { name: "Site Engineer", dept: "Construction" },
    { name: "Accountant", dept: "Finance" },
    { name: "Field Supervisor", dept: "Construction" },
    { name: "IT Administrator", dept: "IT" },
    { name: "Team Lead", dept: "Operations" },
  ];
  const designations: Record<string, { id: string }> = {};
  for (const d of desigData) {
    const desig = await prisma.designation.create({
      data: {
        companyId: COMPANY_ID,
        departmentId: departments[d.dept].id,
        name: d.name,
      },
    });
    designations[d.name] = desig;
  }

  // ── Users & Employees ────────────────────────────────────
  console.log("Creating users and employees...");
  const hashedPw = await PASSWORD_HASH;

  interface UserSeed {
    id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    code: string;
    desig: string;
    dept: string;
    phone: string;
    salary: number;
    staffType: "OFFICE" | "FIELD" | "HYBRID";
  }

  const userData: UserSeed[] = [
    {
      id: "usr-owner",
      email: "owner@company.com",
      password: "Owner@123",
      firstName: "Rajesh",
      lastName: "Kumar",
      role: UserRole.OWNER,
      code: "OWN-001",
      desig: "General Manager",
      dept: "Operations",
      phone: "9876543210",
      salary: 150000,
      staffType: "OFFICE",
    },
    {
      id: "usr-admin",
      email: SEED_ADMIN_EMAIL,
      password: SEED_ADMIN_PASSWORD,
      firstName: "Admin",
      lastName: "User",
      role: UserRole.ADMIN,
      code: "ADM-001",
      desig: "General Manager",
      dept: "Operations",
      phone: "9876543200",
      salary: 140000,
      staffType: "OFFICE",
    },
    {
      id: "usr-admin2",
      email: "admin2@company.com",
      password: SEED_ADMIN_PASSWORD,
      firstName: "Priya",
      lastName: "Sharma",
      role: UserRole.ADMIN,
      code: "ADM-002",
      desig: "IT Administrator",
      dept: "IT",
      phone: "9876543211",
      salary: 120000,
      staffType: "OFFICE",
    },
    {
      id: "usr-hr",
      email: "hr@company.com",
      password: "Hr@12345",
      firstName: "Anita",
      lastName: "Desai",
      role: UserRole.HR_MANAGER,
      code: "HR-001",
      desig: "HR Manager",
      dept: "Human Resources",
      phone: "9876543212",
      salary: 100000,
      staffType: "OFFICE",
    },
    {
      id: "usr-mgr",
      email: "manager@company.com",
      password: "Manager@123",
      firstName: "Vikram",
      lastName: "Patel",
      role: UserRole.MANAGER,
      code: "MGR-001",
      desig: "Operations Manager",
      dept: "Operations",
      phone: "9876543213",
      salary: 90000,
      staffType: "OFFICE",
    },
    {
      id: "usr-tl",
      email: "teamlead@company.com",
      password: "Teamlead@123",
      firstName: "Sanjay",
      lastName: "Mehta",
      role: UserRole.TEAM_LEAD,
      code: "TL-001",
      desig: "Team Lead",
      dept: "Operations",
      phone: "9876543214",
      salary: 80000,
      staffType: "HYBRID",
    },
    {
      id: "usr-sales",
      email: "sales@company.com",
      password: "Sales@12345",
      firstName: "Aarav",
      lastName: "Mehta",
      role: UserRole.EMPLOYEE,
      code: "SAL-001",
      desig: "Sales Executive",
      dept: "Sales",
      phone: "9876543220",
      salary: 50000,
      staffType: "OFFICE",
    },
    {
      id: "usr-emp1",
      email: "employee@company.com",
      password: "Admin@123",
      firstName: "Rahul",
      lastName: "Verma",
      role: UserRole.EMPLOYEE,
      code: "EMP-001",
      desig: "Sales Executive",
      dept: "Sales",
      phone: "9876543215",
      salary: 50000,
      staffType: "OFFICE",
    },
    {
      id: "usr-emp2",
      email: "emp2@company.com",
      password: "Admin@123",
      firstName: "Neha",
      lastName: "Gupta",
      role: UserRole.EMPLOYEE,
      code: "EMP-002",
      desig: "Sales Executive",
      dept: "Sales",
      phone: "9876543216",
      salary: 45000,
      staffType: "OFFICE",
    },
    {
      id: "usr-emp3",
      email: "emp3@company.com",
      password: "Admin@123",
      firstName: "Amit",
      lastName: "Singh",
      role: UserRole.EMPLOYEE,
      code: "EMP-003",
      desig: "Accountant",
      dept: "Finance",
      phone: "9876543217",
      salary: 55000,
      staffType: "OFFICE",
    },
    {
      id: "usr-field",
      email: "field@company.com",
      password: "Field@123",
      firstName: "Deepak",
      lastName: "Yadav",
      role: UserRole.FIELD_EMPLOYEE,
      code: "FE-001",
      desig: "Field Supervisor",
      dept: "Construction",
      phone: "9876543218",
      salary: 45000,
      staffType: "FIELD",
    },
    {
      id: "usr-acct",
      email: "accounts@company.com",
      password: "Accounts@123",
      firstName: "Sunita",
      lastName: "Rao",
      role: UserRole.ACCOUNTS,
      code: "ACC-001",
      desig: "Accountant",
      dept: "Finance",
      phone: "9876543219",
      salary: 60000,
      staffType: "OFFICE",
    },
  ];

  const users: Record<string, { id: string }> = {};
  const employees: Record<string, { id: string; userId: string }> = {};

  for (const u of userData) {
    const userPw = await bcrypt.hash(u.password, BCRYPT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        id: u.id,
        companyId: COMPANY_ID,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        hashedPassword: userPw,
      },
    });
    users[u.id] = user;

    const emp = await prisma.employee.create({
      data: {
        userId: user.id,
        companyId: COMPANY_ID,
        employeeCode: u.code,
        departmentId: departments[u.dept].id,
        designationId: designations[u.desig].id,
        phone: u.phone,
        dateOfJoining: new Date("2025-06-01"),
        salary: u.salary,
        address: "123 MG Road, New Delhi, India",
        status: "ACTIVE",
        staffType: u.staffType,
      },
    });
    employees[u.id] = { id: emp.id, userId: user.id };
  }

  // Set manager relationships
  const mgrEmpId = employees["usr-mgr"].id;
  const tlEmpId = employees["usr-tl"].id;
  const emp1EmpId = employees["usr-emp1"].id;
  const emp2EmpId = employees["usr-emp2"].id;
  const emp3EmpId = employees["usr-emp3"].id;
  const fieldEmpId = employees["usr-field"].id;

  await prisma.employee.update({
    where: { id: emp1EmpId },
    data: { managerId: tlEmpId },
  });
  await prisma.employee.update({
    where: { id: emp2EmpId },
    data: { managerId: tlEmpId },
  });
  await prisma.employee.update({
    where: { id: tlEmpId },
    data: { managerId: mgrEmpId },
  });
  await prisma.employee.update({
    where: { id: fieldEmpId },
    data: { managerId: mgrEmpId },
  });

  // ── Properties ───────────────────────────────────────────
  console.log("Creating properties...");
  const propertyData = [
    {
      title: "Skyline Tower - 2BHK",
      type: PropertyType.APARTMENT,
      status: PropertyStatus.AVAILABLE,
      price: 8500000,
      area: 1200,
      bedrooms: 2,
      bathrooms: 2,
      location: "Sector 62, Noida",
      city: "Noida",
      state: "Uttar Pradesh",
      propertyCode: "PROP-001",
      assignedToEmployeeId: emp1EmpId,
    },
    {
      title: "Green Valley Villa",
      type: PropertyType.VILLA,
      status: PropertyStatus.RESERVED,
      price: 25000000,
      area: 3500,
      bedrooms: 4,
      bathrooms: 4,
      location: "DLF Phase 5, Gurugram",
      city: "Gurugram",
      state: "Haryana",
      propertyCode: "PROP-002",
      assignedToEmployeeId: emp2EmpId,
    },
    {
      title: "Commercial Hub - Office Space",
      type: PropertyType.COMMERCIAL,
      status: PropertyStatus.AVAILABLE,
      price: 15000000,
      area: 2000,
      location: "Connaught Place",
      city: "New Delhi",
      state: "Delhi",
      propertyCode: "PROP-003",
    },
  ];
  for (const p of propertyData) {
    await prisma.property.create({
      data: { companyId: COMPANY_ID, ...p },
    });
  }

  // ── Customers ────────────────────────────────────────────
  console.log("Creating customers...");
  const cust1 = await prisma.customer.create({
    data: {
      companyId: COMPANY_ID,
      name: "Arun Joshi",
      email: "arun.joshi@email.com",
      phone: "9988776655",
      type: CustomerType.BUYER,
      source: "Website",
      createdById: emp1EmpId,
    },
  });
  const cust2 = await prisma.customer.create({
    data: {
      companyId: COMPANY_ID,
      name: "Meera Nair",
      email: "meera.nair@email.com",
      phone: "9988776656",
      type: CustomerType.BUYER,
      source: "Referral",
      createdById: emp2EmpId,
    },
  });

  // ── Leads ────────────────────────────────────────────────
  console.log("Creating leads...");
  const leadData = [
    {
      customerName: "Suresh Reddy",
      customerEmail: "suresh@email.com",
      customerPhone: "9876000001",
      source: LeadSource.WEBSITE,
      status: LeadStatus.NEW,
      assignedToEmployeeId: emp1EmpId,
    },
    {
      customerName: "Kavitha Menon",
      customerEmail: "kavitha@email.com",
      customerPhone: "9876000002",
      source: LeadSource.REFERRAL,
      status: LeadStatus.CONTACTED,
      assignedToEmployeeId: emp2EmpId,
    },
    {
      customerName: "Ravi Shankar",
      customerEmail: "ravi@email.com",
      customerPhone: "9876000003",
      source: LeadSource.SOCIAL_MEDIA,
      status: LeadStatus.INTERESTED,
      assignedToEmployeeId: emp1EmpId,
    },
  ];
  for (const l of leadData) {
    await prisma.lead.create({
      data: { companyId: COMPANY_ID, ...l },
    });
  }

  // ── Construction Sites ───────────────────────────────────
  console.log("Creating construction sites...");
  const site1 = await prisma.constructionSite.create({
    data: {
      companyId: COMPANY_ID,
      name: "ASHA Skyline Towers",
      location: "Sector 62, Noida",
      status: SiteStatus.IN_PROGRESS,
      startDate: new Date("2025-09-01"),
      budget: 50000000,
      description: "Premium residential tower with 200+ units",
    },
  });
  const site2 = await prisma.constructionSite.create({
    data: {
      companyId: COMPANY_ID,
      name: "Green Valley Enclave",
      location: "DLF Phase 5, Gurugram",
      status: SiteStatus.PLANNING,
      startDate: new Date("2026-01-15"),
      budget: 35000000,
      description: "Luxury villa community with 40 units",
    },
  });

  await prisma.sitePhase.create({
    data: {
      companyId: COMPANY_ID,
      siteId: site1.id,
      name: "Foundation",
      description: "Foundation and basement work",
      status: SitePhaseStatus.COMPLETED,
      startDate: new Date("2025-09-01"),
      endDate: new Date("2025-12-15"),
      sortOrder: 1,
    },
  });
  await prisma.sitePhase.create({
    data: {
      companyId: COMPANY_ID,
      siteId: site1.id,
      name: "Structure",
      description: "Structural framing and floors",
      status: SitePhaseStatus.IN_PROGRESS,
      startDate: new Date("2025-12-16"),
      sortOrder: 2,
    },
  });
  await prisma.sitePhase.create({
    data: {
      companyId: COMPANY_ID,
      siteId: site2.id,
      name: "Planning & Approvals",
      description: "Site plan and regulatory approvals",
      status: SitePhaseStatus.IN_PROGRESS,
      startDate: new Date("2026-01-15"),
      sortOrder: 1,
    },
  });

  // ── Tasks ────────────────────────────────────────────────
  console.log("Creating tasks...");
  const taskData = [
    {
      assigneeId: emp1EmpId,
      creatorId: mgrEmpId,
      category: TaskCategory.CLIENT_FOLLOWUP,
      title: "Follow up with Suresh Reddy",
      priority: TaskPriority.IMPORTANT,
      status: TaskStatus.IN_PROGRESS,
      dueDate: new Date(Date.now() + 86400000 * 3),
    },
    {
      assigneeId: fieldEmpId,
      creatorId: mgrEmpId,
      category: TaskCategory.SITE_WORK,
      title: "Site inspection at Skyline Towers",
      priority: TaskPriority.NORMAL,
      status: TaskStatus.PENDING,
      dueDate: new Date(Date.now() + 86400000 * 5),
    },
    {
      assigneeId: emp3EmpId,
      creatorId: mgrEmpId,
      category: TaskCategory.PAYMENT_COLLECTION,
      title: "Process Q2 payroll calculations",
      priority: TaskPriority.CRITICAL,
      status: TaskStatus.PENDING,
      dueDate: new Date(Date.now() + 86400000 * 2),
    },
  ];
  for (const t of taskData) {
    await prisma.task.create({
      data: { companyId: COMPANY_ID, ...t },
    });
  }

  // ── Leave Requests ───────────────────────────────────────
  console.log("Creating leave requests...");
  await prisma.leaveRequest.create({
    data: {
      companyId: COMPANY_ID,
      employeeId: emp1EmpId,
      startDate: new Date(Date.now() + 86400000 * 10),
      endDate: new Date(Date.now() + 86400000 * 12),
      type: LeaveType.MEDICAL,
      reason: "Annual health checkup",
      status: LeaveStatus.PENDING,
    },
  });
  await prisma.leaveRequest.create({
    data: {
      companyId: COMPANY_ID,
      employeeId: emp2EmpId,
      startDate: new Date(Date.now() - 86400000 * 5),
      endDate: new Date(Date.now() - 86400000 * 3),
      type: LeaveType.MEDICAL,
      reason: "Family emergency",
      status: LeaveStatus.APPROVED,
      approvedById: mgrEmpId,
      approvedAt: new Date(Date.now() - 86400000 * 6),
    },
  });

  // ── Warnings ─────────────────────────────────────────────
  console.log("Creating warnings...");
  await prisma.warning.create({
    data: {
      companyId: COMPANY_ID,
      employeeId: emp1EmpId,
      issuerId: employees["usr-hr"].id,
      category: WarningCategory.ATTENDANCE,
      severity: WarningSeverity.LEVEL_1_VERBAL,
      reason: "Repeated late arrivals this month",
      status: ApprovalStatus.APPROVED,
      expiresAt: new Date(Date.now() + 86400000 * 30),
    },
  });

  // ── Meetings ─────────────────────────────────────────────
  console.log("Creating meetings...");
  const mtg1 = await prisma.meeting.create({
    data: {
      companyId: COMPANY_ID,
      title: "Weekly Sales Review",
      scheduledAt: new Date(Date.now() + 86400000 * 2),
      location: "Conference Room A",
      status: MeetingStatus.SCHEDULED,
      organizerId: users["usr-mgr"].id,
    },
  });
  await prisma.meeting.create({
    data: {
      companyId: COMPANY_ID,
      title: "Project Kickoff - Green Valley",
      scheduledAt: new Date(Date.now() + 86400000 * 7),
      location: "Site Office, Gurugram",
      status: MeetingStatus.SCHEDULED,
      organizerId: users["usr-admin"].id,
    },
  });

  // Meeting attendees
  await prisma.meetingAttendee.create({
    data: {
      meetingId: mtg1.id,
      employeeId: emp1EmpId,
      companyId: COMPANY_ID,
      attended: false,
    },
  });
  await prisma.meetingAttendee.create({
    data: {
      meetingId: mtg1.id,
      employeeId: emp2EmpId,
      companyId: COMPANY_ID,
      attended: false,
    },
  });

  // ── SOP Documents ────────────────────────────────────────
  console.log("Creating SOP documents...");
  await prisma.sopDocument.create({
    data: {
      companyId: COMPANY_ID,
      title: "Site Safety Guidelines",
      content:
        "All field employees must wear PPE on construction sites. Hard hats, safety vests, and steel-toe boots are mandatory.",
      departmentId: departments["Construction"].id,
      isActive: true,
      version: "1.0",
    },
  });
  await prisma.sopDocument.create({
    data: {
      companyId: COMPANY_ID,
      title: "Leave Application Process",
      content:
        "Submit leave requests via the ERP portal at least 3 days in advance. Emergency leave can be reported to HR directly.",
      departmentId: departments["Human Resources"].id,
      isActive: true,
      version: "1.0",
    },
  });

  // ── Assets ───────────────────────────────────────────────
  console.log("Creating assets...");
  await prisma.asset.create({
    data: {
      companyId: COMPANY_ID,
      name: "Laptop - Dell Latitude 5540",
      category: "IT Equipment",
      serialNumber: "DL-5540-001",
      status: AssetStatus.ASSIGNED,
      currentAssigneeId: emp1EmpId,
      purchaseDate: new Date("2025-07-01"),
      purchaseCost: 72000,
    },
  });
  await prisma.asset.create({
    data: {
      companyId: COMPANY_ID,
      name: "HP LaserJet Printer",
      category: "Office Equipment",
      serialNumber: "HP-LJ-001",
      status: AssetStatus.AVAILABLE,
      purchaseDate: new Date("2025-03-15"),
      purchaseCost: 25000,
    },
  });
  await prisma.asset.create({
    data: {
      companyId: COMPANY_ID,
      name: "Total Station Survey Equipment",
      category: "Survey Equipment",
      serialNumber: "TS-2025-001",
      status: AssetStatus.IN_REPAIR,
      purchaseDate: new Date("2024-11-20"),
      purchaseCost: 450000,
    },
  });

  // ── Agreements ───────────────────────────────────────────
  console.log("Creating agreements...");
  await prisma.agreement.create({
    data: {
      companyId: COMPANY_ID,
      title: "Construction Contract - Skyline Towers",
      type: AgreementType.CIVIL,
      status: AgreementStatus.APPROVED,
      content:
        "Agreement between ASHA Builders and Skyline Infra for civil works at Sector 62, Noida.",
      createdById: users["usr-admin"].id,
    },
  });
  await prisma.agreement.create({
    data: {
      companyId: COMPANY_ID,
      title: "Vendor Agreement - Material Supply",
      type: AgreementType.OPERATIONS,
      status: AgreementStatus.DRAFT,
      content:
        "Annual material supply agreement with BuildMart for cement, steel, and aggregates.",
      createdById: users["usr-admin"].id,
    },
  });

  // ── Notifications ────────────────────────────────────────
  console.log("Creating notifications...");
  await prisma.notification.create({
    data: {
      userId: users["usr-admin"].id,
      companyId: COMPANY_ID,
      title: "Welcome to ASHA Builders ERP",
      message:
        "Your account has been set up. Explore the dashboard to get started.",
      type: "INFO",
      read: false,
    },
  });
  await prisma.notification.create({
    data: {
      userId: users["usr-emp1"].id,
      companyId: COMPANY_ID,
      title: "New Task Assigned",
      message:
        "You have been assigned: Follow up with Suresh Reddy",
      type: "TASK",
      read: false,
    },
  });
  await prisma.notification.create({
    data: {
      userId: users["usr-tl"].id,
      companyId: COMPANY_ID,
      title: "Leave Request Pending",
      message:
        "Rahul Verma has submitted a leave request for your review.",
      type: "APPROVAL",
      read: false,
    },
  });

  // ── Approval Request ─────────────────────────────────────
  console.log("Creating approval request...");
  await prisma.approvalRequest.create({
    data: {
      companyId: COMPANY_ID,
      entityId: "exp-claim-1",
      entityType: "EXPENSE_CLAIM",
      createdById: users["usr-emp1"].id,
      status: "PENDING",
      approvalSteps: {
        create: [
          {
            companyId: COMPANY_ID,
            sequence: 1,
            status: "PENDING",
            requiredUserId: users["usr-tl"].id,
            slaDeadline: new Date(Date.now() + 86400000 * 2),
          },
          {
            companyId: COMPANY_ID,
            sequence: 2,
            status: "PENDING",
            requiredUserId: users["usr-mgr"].id,
            slaDeadline: new Date(Date.now() + 86400000 * 4),
          },
        ],
      },
    },
  });

  await seedRbac(prisma, COMPANY_ID);

  console.log("Seed complete!");
  console.log(`  Company: ${company.name} (${company.slug})`);
  console.log(`  Users: ${userData.length}`);
  console.log(`  Departments: ${deptData.length}`);
  console.log(`  Designations: ${desigData.length}`);
  console.log(`  Properties: ${propertyData.length}`);
  console.log(`  Customers: 2`);
  console.log(`  Leads: ${leadData.length}`);
  console.log(`  Construction Sites: 2`);
  console.log(`  Tasks: 3`);
  console.log(`  Meetings: 2`);
  console.log(`  SOPs: 2`);
  console.log(`  Assets: 3`);
  console.log(`  Agreements: 2`);
  console.log(`  Notifications: 3`);
  console.log();
  console.log(`Login: ${SEED_ADMIN_EMAIL} / ${SEED_ADMIN_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
