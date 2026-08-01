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

  const tables = await prisma.$queryRawUnsafe<{ tablename: string }[]>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations'`,
  );
  const tablesInOrder = tables.map((t) => `"${t.tablename}"`);

  await prisma.$queryRawUnsafe(
    `TRUNCATE TABLE ${tablesInOrder.join(', ')} RESTART IDENTITY CASCADE`,
  );
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

  const shift = await prisma.shiftDefinition.create({
    data: {
      companyId: company.id,
      name: 'Default Shift',
      startTime: '09:00',
      endTime: '18:00',
      gracePeriodMinutes: 15,
      isActive: true,
    },
  });

  const approverRole = await prisma.role.create({
    data: {
      companyId: company.id,
      name: 'Attendance Approver',
      isSystem: false,
    },
  });

  const attendanceCorrectionTemplate = await prisma.approvalTemplate.create({
    data: {
      companyId: company.id,
      entityType: 'AttendanceCorrection',
      description: 'Attendance correction approval',
    },
  });

  await prisma.approvalTemplateStep.create({
    data: {
      templateId: attendanceCorrectionTemplate.id,
      companyId: company.id,
      sequence: 1,
      requiredRoleId: approverRole.id,
      slaHours: 24,
    },
  });

  const warningApprovalTemplate = await prisma.approvalTemplate.create({
    data: {
      companyId: company.id,
      entityType: 'WARNING_APPROVAL',
      description: 'Warning approval',
    },
  });

  await prisma.approvalTemplateStep.create({
    data: {
      templateId: warningApprovalTemplate.id,
      companyId: company.id,
      sequence: 1,
      requiredRoleId: approverRole.id,
      slaHours: 24,
    },
  });

  return {
    company,
    department,
    designation,
    user,
    employee,
    shift,
    password: 'Password@123',
  };
}
