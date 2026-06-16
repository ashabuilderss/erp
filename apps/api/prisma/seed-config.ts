import { UserRole } from "@prisma/client";

export interface DemoSeedUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  employeeCode: string;
  department: string;
  designation: string;
  phone: string;
}

export interface SeedConfig {
  companyName: string;
  companySlug: string;
  adminEmail: string;
  adminPassword: string;
  bcryptRounds: number;
  demoUsers: DemoSeedUser[];
}

export interface SeedCompanyCounts {
  userCount: number;
  employeeCount: number;
  relatedRecordCount?: number;
}

const LOCAL_DEFAULT_PASSWORD = "Admin@123";
const LOCAL_DEMO_USERS: DemoSeedUser[] = [
  {
    email: "admin@company.com",
    password: LOCAL_DEFAULT_PASSWORD,
    firstName: "Admin",
    lastName: "User",
    role: UserRole.ADMIN,
    employeeCode: "ADM-001",
    department: "Operations",
    designation: "Operations Manager",
    phone: "+91 98765 10001",
  },
  {
    email: "hr@company.com",
    password: "Hr@12345",
    firstName: "Priya",
    lastName: "Sharma",
    role: UserRole.HR_MANAGER,
    employeeCode: "HR-001",
    department: "Human Resources",
    designation: "HR Manager",
    phone: "+91 98765 10002",
  },
  {
    email: "sales@company.com",
    password: "Sales@12345",
    firstName: "Aarav",
    lastName: "Mehta",
    role: UserRole.EMPLOYEE,
    employeeCode: "SAL-001",
    department: "Sales",
    designation: "Sales Manager",
    phone: "+91 98765 10003",
  },
  {
    email: "agent@company.com",
    password: "Agent@12345",
    firstName: "Neha",
    lastName: "Kapoor",
    role: UserRole.EMPLOYEE,
    employeeCode: "SAL-002",
    department: "Sales",
    designation: "Sales Executive",
    phone: "+91 98765 10004",
  },
  {
    email: "ops@company.com",
    password: "Ops@12345",
    firstName: "Vikram",
    lastName: "Rao",
    role: UserRole.EMPLOYEE,
    employeeCode: "OPS-001",
    department: "Operations",
    designation: "Operations Executive",
    phone: "+91 98765 10005",
  },
];
const PRODUCTION_TEMPLATE_VALUES = new Set([
  "Default Company",
  "default-company",
  "admin@company.com",
  "Owner Company",
  "owner-company",
  "owner-admin@example.com",
  "replace-with-temporary-password-and-rotate-after-login",
]);
const PRODUCTION_EXISTING_COMPANY_ERROR =
  "Production seed refuses to reset an existing company. Seed only an empty production company.";

function isBlank(value: string | undefined): boolean {
  return !value?.trim();
}

function isProductionTemplateValue(value: string): boolean {
  return PRODUCTION_TEMPLATE_VALUES.has(value.trim());
}

export function getSeedConfig(env: NodeJS.ProcessEnv = process.env): SeedConfig {
  const seedCompanyName = env.SEED_COMPANY_NAME || "Default Company";
  const seedCompanySlug = env.SEED_COMPANY_SLUG || "default-company";
  const seedAdminEmail = env.SEED_ADMIN_EMAIL || "admin@company.com";
  const seedAdminPassword = env.SEED_ADMIN_PASSWORD || LOCAL_DEFAULT_PASSWORD;

  if (env.NODE_ENV === "production") {
    const missing = [
      ["SEED_COMPANY_NAME", env.SEED_COMPANY_NAME],
      ["SEED_COMPANY_SLUG", env.SEED_COMPANY_SLUG],
      ["SEED_ADMIN_EMAIL", env.SEED_ADMIN_EMAIL],
      ["SEED_ADMIN_PASSWORD", env.SEED_ADMIN_PASSWORD],
    ].filter(([, value]) => isBlank(value));

    if (missing.length > 0) {
      throw new Error(
        `Production seed requires explicit values: ${missing
          .map(([key]) => key)
          .join(", ")}`,
      );
    }

    if (seedAdminPassword === LOCAL_DEFAULT_PASSWORD) {
      throw new Error("Production seed password must not use the local default password");
    }

    const placeholders = [
      ["SEED_COMPANY_NAME", seedCompanyName],
      ["SEED_COMPANY_SLUG", seedCompanySlug],
      ["SEED_ADMIN_EMAIL", seedAdminEmail],
      ["SEED_ADMIN_PASSWORD", seedAdminPassword],
    ].filter(([, value]) => isProductionTemplateValue(value));

    if (placeholders.length > 0) {
      throw new Error(
        `Production seed values must replace template placeholders: ${placeholders
          .map(([key]) => key)
          .join(", ")}`,
      );
    }
  }

  return {
    companyName: seedCompanyName,
    companySlug: seedCompanySlug,
    adminEmail: seedAdminEmail,
    adminPassword: seedAdminPassword,
    bcryptRounds: 12,
    demoUsers: env.NODE_ENV === "production" ? [] : LOCAL_DEMO_USERS,
  };
}

export function assertProductionSeedCompanyIsEmpty(
  env: NodeJS.ProcessEnv,
  counts: SeedCompanyCounts,
): void {
  if (env.NODE_ENV !== "production") {
    return;
  }

  if (counts.userCount > 0 || counts.employeeCount > 0 || (counts.relatedRecordCount ?? 0) > 0) {
    throw new Error(PRODUCTION_EXISTING_COMPANY_ERROR);
  }
}
