import {
  AssignmentType,
  AttendanceStatus,
  BookingStatus,
  CustomerType,
  Employee,
  LeadSource,
  LeadStatus,
  LeaveStatus,
  LeaveType,
  PaymentStatus,
  PrismaClient,
  PropertyStatus,
  PropertyType,
  SiteVisitStatus,
  UserRole,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcrypt";
import { assertProductionSeedCompanyIsEmpty, DemoSeedUser, getSeedConfig } from "./seed-config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const departments = [
  { name: "Sales", description: "Property sales, lead nurturing, site visits, and closures" },
  { name: "Marketing", description: "Campaigns, listings, and lead generation" },
  { name: "Human Resources", description: "People operations, attendance, and leave management" },
  { name: "Operations", description: "Property operations and customer coordination" },
];

const designationsByDepartment: Record<string, string[]> = {
  Sales: ["Sales Manager", "Sales Executive"],
  Marketing: ["Marketing Executive"],
  "Human Resources": ["HR Manager"],
  Operations: ["Operations Manager", "Operations Executive"],
};

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setHours(10, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

async function clearLocalDemoCompany(companyId: string) {
  await prisma.employeeAssignment.deleteMany({ where: { companyId } });
  await prisma.performance.deleteMany({ where: { companyId } });
  await prisma.leaveRequest.deleteMany({ where: { companyId } });
  await prisma.leaveAllocation.deleteMany({ where: { companyId } });
  await prisma.attendance.deleteMany({ where: { companyId } });
  await prisma.booking.deleteMany({ where: { companyId } });
  await prisma.siteVisit.deleteMany({ where: { companyId } });
  await prisma.lead.deleteMany({ where: { companyId } });
  await prisma.customer.deleteMany({ where: { companyId } });
  await prisma.property.deleteMany({ where: { companyId } });
  await prisma.activityLog.deleteMany({ where: { companyId } });
  await prisma.notification.deleteMany({ where: { companyId } });
  await prisma.refreshToken.deleteMany({ where: { companyId } });
  await prisma.employee.deleteMany({ where: { companyId } });
  await prisma.user.deleteMany({ where: { companyId } });
}

async function seedDepartmentsAndDesignations(companyId: string) {
  const seededDepartments = new Map<string, { id: string; name: string }>();
  const seededDesignations = new Map<string, { id: string; name: string }>();

  for (const department of departments) {
    const seededDepartment = await prisma.department.upsert({
      where: { companyId_name: { companyId, name: department.name } },
      update: { description: department.description },
      create: { ...department, companyId },
    });
    seededDepartments.set(department.name, seededDepartment);

    for (const designationName of designationsByDepartment[department.name] ?? []) {
      const designation = await prisma.designation.upsert({
        where: { name_departmentId: { name: designationName, departmentId: seededDepartment.id } },
        update: {},
        create: { name: designationName, departmentId: seededDepartment.id, companyId },
      });
      seededDesignations.set(`${department.name}:${designationName}`, designation);
    }
  }

  return { seededDepartments, seededDesignations };
}

async function createUserWithEmployee(
  companyId: string,
  demoUser: DemoSeedUser,
  bcryptRounds: number,
  departmentsByName: Map<string, { id: string; name: string }>,
  designationsByName: Map<string, { id: string; name: string }>,
  managerId?: string,
) {
  const department = departmentsByName.get(demoUser.department);
  const designation = designationsByName.get(`${demoUser.department}:${demoUser.designation}`);

  if (!department || !designation) {
    throw new Error(`Missing department/designation for ${demoUser.email}`);
  }

  const user = await prisma.user.create({
    data: {
      email: demoUser.email,
      companyId,
      firstName: demoUser.firstName,
      lastName: demoUser.lastName,
      role: demoUser.role,
      hashedPassword: await bcrypt.hash(demoUser.password, bcryptRounds),
    },
  });

  return prisma.employee.create({
    data: {
      userId: user.id,
      employeeCode: demoUser.employeeCode,
      companyId,
      departmentId: department.id,
      designationId: designation.id,
      managerId,
      phone: demoUser.phone,
      dateOfJoining: daysFromNow(-120),
      salary: demoUser.role === UserRole.ADMIN ? 125000 : demoUser.role === UserRole.HR_MANAGER ? 95000 : 72000,
      address: "Demo office, MG Road, Bengaluru",
      status: "ACTIVE",
    },
  });
}

async function createProductionAdmin(
  companyId: string,
  adminEmail: string,
  adminPassword: string,
  bcryptRounds: number,
  departmentsByName: Map<string, { id: string; name: string }>,
  designationsByName: Map<string, { id: string; name: string }>,
) {
  const adminDemoUser: DemoSeedUser = {
    email: adminEmail,
    password: adminPassword,
    firstName: "Admin",
    lastName: "User",
    role: UserRole.ADMIN,
    employeeCode: "ADM-001",
    department: "Operations",
    designation: "Operations Manager",
    phone: "",
  };

  return createUserWithEmployee(
    companyId,
    adminDemoUser,
    bcryptRounds,
    departmentsByName,
    designationsByName,
  );
}

async function seedCrmDemo(companyId: string, salesManager: Employee, salesAgent: Employee) {
  const [skyline, greenwood, commerceHub] = await Promise.all([
    prisma.property.create({
      data: {
        propertyCode: "PROP-DEMO-001",
        title: "Skyline Residency 3BHK",
        description: "Ready-to-move apartment near metro with clubhouse access.",
        type: PropertyType.APARTMENT,
        status: PropertyStatus.AVAILABLE,
        price: 12500000,
        area: 1680,
        bedrooms: 3,
        bathrooms: 3,
        location: "Whitefield Main Road",
        locality: "Whitefield",
        city: "Bengaluru",
        state: "Karnataka",
        amenities: ["Clubhouse", "Gym", "Covered Parking", "Power Backup"],
        companyId,
        assignedToEmployeeId: salesAgent.id,
      },
    }),
    prisma.property.create({
      data: {
        propertyCode: "PROP-DEMO-002",
        title: "Greenwood Villa",
        description: "Premium villa with private garden and community amenities.",
        type: PropertyType.VILLA,
        status: PropertyStatus.RESERVED,
        price: 27500000,
        area: 3200,
        bedrooms: 4,
        bathrooms: 4,
        location: "Sarjapur Road",
        locality: "Sarjapur",
        city: "Bengaluru",
        state: "Karnataka",
        amenities: ["Private Garden", "Security", "Swimming Pool"],
        companyId,
        assignedToEmployeeId: salesManager.id,
      },
    }),
    prisma.property.create({
      data: {
        propertyCode: "PROP-DEMO-003",
        title: "Commerce Hub Office Suite",
        description: "Compact commercial office space for growing teams.",
        type: PropertyType.COMMERCIAL,
        status: PropertyStatus.BOOKED,
        price: 8900000,
        area: 1100,
        bathrooms: 2,
        location: "Outer Ring Road",
        locality: "Marathahalli",
        city: "Bengaluru",
        state: "Karnataka",
        amenities: ["Lift", "Reception", "Conference Room"],
        companyId,
        assignedToEmployeeId: salesManager.id,
      },
    }),
  ]);

  const [ananya, rohan] = await Promise.all([
    prisma.customer.create({
      data: {
        name: "Ananya Iyer",
        email: "ananya.demo@example.com",
        phone: "+91 90000 10001",
        address: "Indiranagar, Bengaluru",
        type: CustomerType.BUYER,
        source: "Website",
        notes: "Looking for a 3BHK close to school and metro access.",
        companyId,
        createdById: salesAgent.id,
      },
    }),
    prisma.customer.create({
      data: {
        name: "Rohan Malhotra",
        email: "rohan.demo@example.com",
        phone: "+91 90000 10002",
        address: "Koramangala, Bengaluru",
        type: CustomerType.BUYER,
        source: "Referral",
        notes: "Interested in commercial space for a consulting office.",
        companyId,
        createdById: salesManager.id,
      },
    }),
  ]);

  const [leadOne, leadTwo, convertedLead] = await Promise.all([
    prisma.lead.create({
      data: {
        propertyId: skyline.id,
        customerName: "Ananya Iyer",
        customerEmail: "ananya.demo@example.com",
        customerPhone: "+91 90000 10001",
        source: LeadSource.WEBSITE,
        status: LeadStatus.SITE_VISIT_SCHEDULED,
        notes: "Requested a weekend site visit.",
        companyId,
        assignedToEmployeeId: salesAgent.id,
      },
    }),
    prisma.lead.create({
      data: {
        propertyId: greenwood.id,
        customerName: "Meera Nair",
        customerEmail: "meera.demo@example.com",
        customerPhone: "+91 90000 10003",
        source: LeadSource.SOCIAL_MEDIA,
        status: LeadStatus.NEGOTIATION,
        notes: "Comparing villa options in Sarjapur.",
        companyId,
        assignedToEmployeeId: salesManager.id,
      },
    }),
    prisma.lead.create({
      data: {
        propertyId: commerceHub.id,
        customerName: "Rohan Malhotra",
        customerEmail: "rohan.demo@example.com",
        customerPhone: "+91 90000 10002",
        source: LeadSource.REFERRAL,
        status: LeadStatus.CONVERTED,
        notes: "Converted after second commercial site visit.",
        companyId,
        assignedToEmployeeId: salesManager.id,
        convertedToCustomerId: rohan.id,
      },
    }),
  ]);

  await Promise.all([
    prisma.siteVisit.create({
      data: {
        propertyId: skyline.id,
        customerId: ananya.id,
        leadId: leadOne.id,
        companyId,
        scheduledDate: daysFromNow(2),
        status: SiteVisitStatus.SCHEDULED,
        notes: "Meet at project sales office.",
        assignedToEmployeeId: salesAgent.id,
      },
    }),
    prisma.siteVisit.create({
      data: {
        propertyId: commerceHub.id,
        customerId: rohan.id,
        leadId: convertedLead.id,
        companyId,
        scheduledDate: daysFromNow(-3),
        status: SiteVisitStatus.COMPLETED,
        notes: "Customer reviewed parking and floor plan.",
        feedback: "Positive; requested booking paperwork.",
        assignedToEmployeeId: salesManager.id,
      },
    }),
  ]);

  const booking = await prisma.booking.create({
    data: {
      propertyId: commerceHub.id,
      customerId: rohan.id,
      leadId: convertedLead.id,
      companyId,
      bookingDate: daysFromNow(-1),
      amount: 8900000,
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PARTIAL,
      notes: "Initial token received; payment schedule shared.",
      assignedToEmployeeId: salesManager.id,
    },
  });

  await Promise.all([
    prisma.employeeAssignment.create({
      data: {
        employeeId: salesAgent.id,
        companyId,
        type: AssignmentType.LEAD,
        entityId: leadOne.id,
        startDate: daysFromNow(-5),
        notes: "Own first contact and site visit coordination.",
      },
    }),
    prisma.employeeAssignment.create({
      data: {
        employeeId: salesManager.id,
        companyId,
        type: AssignmentType.BOOKING,
        entityId: booking.id,
        startDate: daysFromNow(-2),
        notes: "Handle booking closure and payment follow-up.",
      },
    }),
    prisma.employeeAssignment.create({
      data: {
        employeeId: salesManager.id,
        companyId,
        type: AssignmentType.PROPERTY,
        entityId: greenwood.id,
        startDate: daysFromNow(-30),
        notes: "Primary owner for premium villa inventory.",
      },
    }),
  ]);

  return { properties: [skyline, greenwood, commerceHub], leads: [leadOne, leadTwo, convertedLead], customers: [ananya, rohan] };
}

async function seedHrAndPerformanceDemo(companyId: string, employees: Employee[], hrManager: Employee) {
  const year = new Date().getFullYear();

  await Promise.all(
    employees.flatMap((employee, index) => [
      prisma.attendance.create({
        data: {
          employeeId: employee.id,
          companyId,
          date: daysFromNow(-1),
          checkIn: daysFromNow(-1),
          checkOut: new Date(daysFromNow(-1).setHours(18, 30, 0, 0)),
          status: index === 4 ? AttendanceStatus.HALF_DAY : AttendanceStatus.PRESENT,
          verified: true,
          verifiedById: hrManager.id,
          verifiedAt: daysFromNow(0),
        },
      }),
      prisma.leaveAllocation.create({
        data: {
          employeeId: employee.id,
          companyId,
          year,
          leaveType: LeaveType.ANNUAL,
          totalDays: 18,
          usedDays: index === 2 ? 3 : 1,
        },
      }),
      prisma.performance.create({
        data: {
          employeeId: employee.id,
          companyId,
          year,
          quarter: 2,
          score: Math.max(78, 92 - index * 3),
          notes: "Demo quarterly performance score for EMS reporting.",
        },
      }),
    ]),
  );

  await Promise.all([
    prisma.leaveRequest.create({
      data: {
        employeeId: employees[2].id,
        companyId,
        startDate: daysFromNow(5),
        endDate: daysFromNow(7),
        type: LeaveType.ANNUAL,
        reason: "Family travel",
        status: LeaveStatus.PENDING,
      },
    }),
    prisma.leaveRequest.create({
      data: {
        employeeId: employees[3].id,
        companyId,
        startDate: daysFromNow(-12),
        endDate: daysFromNow(-11),
        type: LeaveType.SICK,
        reason: "Medical appointment",
        status: LeaveStatus.APPROVED,
        approvedById: hrManager.id,
        approvedAt: daysFromNow(-10),
      },
    }),
  ]);
}

async function main() {
  const seedConfig = getSeedConfig();

  const company = await prisma.company.upsert({
    where: { slug: seedConfig.companySlug },
    update: process.env.NODE_ENV === "production" ? {} : { name: seedConfig.companyName },
    create: { name: seedConfig.companyName, slug: seedConfig.companySlug },
  });

  if (process.env.NODE_ENV === "production") {
    const [
      userCount,
      employeeCount,
      propertyCount,
      leadCount,
      customerCount,
      siteVisitCount,
      bookingCount,
      attendanceCount,
      leaveRequestCount,
      leaveAllocationCount,
      employeeAssignmentCount,
      performanceCount,
      departmentCount,
      designationCount,
    ] = await Promise.all([
      prisma.user.count({ where: { companyId: company.id } }),
      prisma.employee.count({ where: { companyId: company.id } }),
      prisma.property.count({ where: { companyId: company.id } }),
      prisma.lead.count({ where: { companyId: company.id } }),
      prisma.customer.count({ where: { companyId: company.id } }),
      prisma.siteVisit.count({ where: { companyId: company.id } }),
      prisma.booking.count({ where: { companyId: company.id } }),
      prisma.attendance.count({ where: { companyId: company.id } }),
      prisma.leaveRequest.count({ where: { companyId: company.id } }),
      prisma.leaveAllocation.count({ where: { companyId: company.id } }),
      prisma.employeeAssignment.count({ where: { companyId: company.id } }),
      prisma.performance.count({ where: { companyId: company.id } }),
      prisma.department.count({ where: { companyId: company.id } }),
      prisma.designation.count({ where: { companyId: company.id } }),
    ]);
    const relatedRecordCount =
      propertyCount +
      leadCount +
      customerCount +
      siteVisitCount +
      bookingCount +
      attendanceCount +
      leaveRequestCount +
      leaveAllocationCount +
      employeeAssignmentCount +
      performanceCount +
      departmentCount +
      designationCount;

    assertProductionSeedCompanyIsEmpty(process.env, { userCount, employeeCount, relatedRecordCount });
  } else {
    await clearLocalDemoCompany(company.id);
  }

  const { seededDepartments, seededDesignations } = await seedDepartmentsAndDesignations(company.id);

  if (process.env.NODE_ENV === "production") {
    const adminEmployee = await createProductionAdmin(
      company.id,
      seedConfig.adminEmail,
      seedConfig.adminPassword,
      seedConfig.bcryptRounds,
      seededDepartments,
      seededDesignations,
    );

    console.log("Seed completed successfully");
    console.log(`  - 1 company (${company.name})`);
    console.log(`  - 1 admin user (${seedConfig.adminEmail})`);
    console.log("  - Rotate temporary credentials after first login");
    console.log(`  - ${departments.length} departments`);
    console.log(`  - 1 admin employee (${adminEmployee.employeeCode}) for leave approval`);
    return;
  }

  const admin = seedConfig.demoUsers.find((user) => user.role === UserRole.ADMIN);
  const hr = seedConfig.demoUsers.find((user) => user.role === UserRole.HR_MANAGER);
  const salesManager = seedConfig.demoUsers.find((user) => user.employeeCode === "SAL-001");
  const salesAgent = seedConfig.demoUsers.find((user) => user.employeeCode === "SAL-002");

  if (!admin || !hr || !salesManager || !salesAgent) {
    throw new Error("Local demo users are incomplete");
  }

  const adminEmployee = await createUserWithEmployee(
    company.id,
    admin,
    seedConfig.bcryptRounds,
    seededDepartments,
    seededDesignations,
  );

  const createdEmployees: Employee[] = [adminEmployee];
  for (const demoUser of seedConfig.demoUsers.filter((user) => user.email !== admin.email)) {
    createdEmployees.push(
      await createUserWithEmployee(
        company.id,
        demoUser,
        seedConfig.bcryptRounds,
        seededDepartments,
        seededDesignations,
        adminEmployee.id,
      ),
    );
  }

  const hrEmployee = createdEmployees.find((employee) => employee.employeeCode === hr.employeeCode)!;
  const salesManagerEmployee = createdEmployees.find((employee) => employee.employeeCode === salesManager.employeeCode)!;
  const salesAgentEmployee = createdEmployees.find((employee) => employee.employeeCode === salesAgent.employeeCode)!;

  const crm = await seedCrmDemo(company.id, salesManagerEmployee, salesAgentEmployee);
  await seedHrAndPerformanceDemo(company.id, createdEmployees, hrEmployee);

  console.log("Seed completed successfully");
  console.log(`  - 1 company (${company.name})`);
  console.log(`  - ${seedConfig.demoUsers.length} demo users/employees`);
  console.log(`  - ${departments.length} departments`);
  console.log(`  - ${crm.properties.length} properties, ${crm.leads.length} leads, ${crm.customers.length} customers`);
  console.log("  - Site visits, booking, attendance, leave, assignments, and performance demo rows");
  console.log("  - Demo credentials:");
  for (const user of seedConfig.demoUsers) {
    console.log(`    ${user.email} / ${user.password} (${user.role})`);
  }
}

main()
  .catch((e) => { console.error("Seed failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
