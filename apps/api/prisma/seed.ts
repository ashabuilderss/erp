import { PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcrypt";
import { assertProductionSeedCompanyIsEmpty, getSeedConfig } from "./seed-config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const seedConfig = getSeedConfig();

  const company = await prisma.company.upsert({
    where: { slug: seedConfig.companySlug },
    update: {},
    create: { name: seedConfig.companyName, slug: seedConfig.companySlug },
  });

  if (process.env.NODE_ENV === "production") {
    const [userCount, employeeCount] = await Promise.all([
      prisma.user.count({ where: { companyId: company.id } }),
      prisma.employee.count({ where: { companyId: company.id } }),
    ]);

    assertProductionSeedCompanyIsEmpty(process.env, { userCount, employeeCount });
  } else {
    await prisma.employee.deleteMany({ where: { companyId: company.id } });
    await prisma.user.deleteMany({ where: { companyId: company.id } });
  }

  const hashedPassword = await bcrypt.hash(seedConfig.adminPassword, seedConfig.bcryptRounds);

  const adminUser = await prisma.user.create({
    data: {
      email: seedConfig.adminEmail,
      companyId: company.id,
      firstName: "Admin",
      lastName: "User",
      role: UserRole.ADMIN,
      hashedPassword,
    },
  });

  const departments = await Promise.all([
    prisma.department.upsert({
      where: { companyId_name: { companyId: company.id, name: "Sales" } },
      update: {},
      create: { name: "Sales", companyId: company.id, description: "Property sales team" },
    }),
    prisma.department.upsert({
      where: { companyId_name: { companyId: company.id, name: "Marketing" } },
      update: {},
      create: { name: "Marketing", companyId: company.id, description: "Marketing and lead generation" },
    }),
    prisma.department.upsert({
      where: { companyId_name: { companyId: company.id, name: "Human Resources" } },
      update: {},
      create: { name: "Human Resources", companyId: company.id, description: "HR and administration" },
    }),
    prisma.department.upsert({
      where: { companyId_name: { companyId: company.id, name: "Operations" } },
      update: {},
      create: { name: "Operations", companyId: company.id, description: "Property operations and management" },
    }),
  ]);

  const salesDept = departments.find((d) => d.name === "Sales")!;
  await prisma.designation.upsert({
    where: { name_departmentId: { name: "Sales Manager", departmentId: salesDept.id } },
    update: {},
    create: { name: "Sales Manager", departmentId: salesDept.id, companyId: company.id },
  });
  await prisma.designation.upsert({
    where: { name_departmentId: { name: "Sales Executive", departmentId: salesDept.id } },
    update: {},
    create: { name: "Sales Executive", departmentId: salesDept.id, companyId: company.id },
  });

  const hrDept = departments.find((d) => d.name === "Human Resources")!;
  await prisma.designation.upsert({
    where: { name_departmentId: { name: "HR Manager", departmentId: hrDept.id } },
    update: {},
    create: { name: "HR Manager", departmentId: hrDept.id, companyId: company.id },
  });

  const opsDept = departments.find((d) => d.name === "Operations")!;
  await prisma.designation.upsert({
    where: { name_departmentId: { name: "Operations Manager", departmentId: opsDept.id } },
    update: {},
    create: { name: "Operations Manager", departmentId: opsDept.id, companyId: company.id },
  });

  const opsManagerDesignation = await prisma.designation.findFirstOrThrow({
    where: { name: "Operations Manager", departmentId: opsDept.id },
  });
  await prisma.employee.create({
    data: {
      userId: adminUser.id,
      employeeCode: "OM-001",
      companyId: company.id,
      departmentId: opsDept.id,
      designationId: opsManagerDesignation.id,
      status: "ACTIVE",
    },
  });

  console.log("Seed completed successfully");
  console.log(`  - 1 company (${company.name})`);
  console.log(`  - 1 admin user (${adminUser.email})`);
  console.log("  - Rotate temporary credentials after first login");
  console.log(`  - ${departments.length} departments`);
  console.log(`  - 1 admin employee (OM-001) for leave approval`);
}

main()
  .catch((e) => { console.error("Seed failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
