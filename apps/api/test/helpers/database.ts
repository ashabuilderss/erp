import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../src/config/prisma.service';

export async function resetDatabase(prisma: PrismaService): Promise<void> {
  if (
    process.env.NODE_ENV !== 'test' &&
    process.env.ALLOW_E2E_DB_RESET !== 'true'
  ) {
    throw new Error('Refusing to reset database outside the test environment');
  }

  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "activity_logs",
      "notifications",
      "employee_assignments",
      "performance",
      "leave_allocations",
      "leave_requests",
      "attendance",
      "bookings",
      "site_visits",
      "customers",
      "task_comments",
      "attendance_corrections",
      "leads",
      "properties",
      "refresh_tokens",
      "employees",
      "designations",
      "departments",
      "users",
      "companies"
    RESTART IDENTITY CASCADE;
  `);
}

export async function createCompanyFixture(
  prisma: PrismaService,
  slug: string,
  role: UserRole = UserRole.ADMIN,
) {
  const company = await prisma.company.create({
    data: { name: `${slug} Company`, slug },
  });

  const department = await prisma.department.create({
    data: { companyId: company.id, name: 'Operations' },
  });

  const designation = await prisma.designation.create({
    data: {
      companyId: company.id,
      departmentId: department.id,
      name: 'Operations Manager',
    },
  });

  const user = await prisma.user.create({
    data: {
      companyId: company.id,
      email: `${slug}-admin@example.com`,
      firstName: slug,
      lastName: 'Admin',
      role,
      hashedPassword: await bcrypt.hash('Password@123', 12),
    },
  });

  const employee = await prisma.employee.create({
    data: {
      companyId: company.id,
      userId: user.id,
      departmentId: department.id,
      designationId: designation.id,
      employeeCode: `${slug.toUpperCase()}-001`,
      status: 'ACTIVE',
    },
  });

  return {
    company,
    department,
    designation,
    user,
    employee,
    password: 'Password@123',
  };
}
