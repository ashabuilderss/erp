import {
  AssignmentType,
  AttendanceStatus,
  BookingStatus,
  CommissionStatus,
  ComplaintStatus,
  CustomerType,
  Employee,
  EodReportStatus,
  EscalationEventStatus,
  EscalationTriggerType,
  ExpenseStatus,
  IncentiveStatus,
  LabourType,
  LeadSource,
  LeadStatus,
  LeaveStatus,
  LeaveType,
  PayoutStatus,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
  PropertyStatus,
  PropertyType,
  ScheduleStatus,
  SitePhaseStatus,
  SiteStatus,
  SiteVisitStatus,
  UserRole,
  VendorStatus,
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
  await prisma.payslip.deleteMany({ where: { companyId } });
  await prisma.payrollRun.deleteMany({ where: { companyId } });
  await prisma.paymentEntry.deleteMany({ where: { companyId } });
  await prisma.paymentSchedule.deleteMany({ where: { companyId } });
  await prisma.complaint.deleteMany({ where: { companyId } });
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
  await prisma.escalationEvent.deleteMany({ where: { companyId } });
  await prisma.labourEntry.deleteMany({ where: { companyId } });
  await prisma.materialInward.deleteMany({ where: { companyId } });
  await prisma.inventoryItem.deleteMany({ where: { companyId } });
  await prisma.sitePhase.deleteMany({ where: { site: { companyId } } });
  await prisma.escalationRule.deleteMany({ where: { companyId } });
  await prisma.constructionSite.deleteMany({ where: { companyId } });
  await prisma.material.deleteMany({ where: { companyId } });
  await prisma.vendor.deleteMany({ where: { companyId } });
  await prisma.broker.deleteMany({ where: { companyId } });
  await prisma.pipelineCommission.deleteMany({ where: { companyId } });
  await prisma.incentive.deleteMany({ where: { companyId } });
  await prisma.activityLog.deleteMany({ where: { companyId } });
  await prisma.notification.deleteMany({ where: { companyId } });
  await prisma.refreshToken.deleteMany({ where: { companyId } });
  await prisma.expenseClaim.deleteMany({ where: { companyId } });
  await prisma.eodReport.deleteMany({ where: { companyId } });
  await prisma.deviceRegistration.deleteMany({ where: { companyId } });
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
        where: { companyId_name_departmentId: { companyId, name: designationName, departmentId: seededDepartment.id } },
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
      salary: demoUser.role === UserRole.OWNER ? 250000 : demoUser.role === UserRole.ADMIN ? 125000 : demoUser.role === UserRole.HR_MANAGER ? 95000 : 72000,
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

  return { properties: [skyline, greenwood, commerceHub], leads: [leadOne, leadTwo, convertedLead], customers: [ananya, rohan], booking };
}

async function seedOpsData(
  companyId: string,
  opsEmployee: Employee,
  crmData: { properties: { id: string }[]; leads: { id: string }[] },
) {
  // Update Commerce Hub property to be assigned to OPS-001
  await prisma.property.update({
    where: { id: crmData.properties[2].id },
    data: { assignedToEmployeeId: opsEmployee.id },
  });

  // Update converted lead (Rohan Malhotra) to be assigned to OPS-001
  await prisma.lead.update({
    where: { id: crmData.leads[2].id },
    data: { assignedToEmployeeId: opsEmployee.id },
  });

  // Add employee assignment for OPS-001
  await prisma.employeeAssignment.create({
    data: {
      employeeId: opsEmployee.id,
      companyId,
      type: AssignmentType.PROPERTY,
      entityId: crmData.properties[2].id,
      startDate: daysFromNow(-30),
      notes: "Primary owner for commercial office suite inventory.",
    },
  });
}

async function seedPayrollDemo(
  companyId: string,
  employees: Employee[],
  processedByEmployeeId: string,
) {
  const periodStart = new Date();
  periodStart.setMonth(periodStart.getMonth() - 1);
  periodStart.setDate(1);
  const periodEnd = new Date();
  periodEnd.setDate(0);

  const run = await prisma.payrollRun.create({
    data: { companyId, periodStart, periodEnd, notes: "Demo payroll run — auto-generated" },
  });

  const payslipData = employees
    .filter((e) => e.salary)
    .map((emp) => {
      const basic = Number(emp.salary);
      const hra = Math.round(basic * 0.4 * 100) / 100;
      const da = Math.round(basic * 0.1 * 100) / 100;
      const gross = basic + hra + da;
      const pf = Math.round(Math.min(basic * 0.12, 1800) * 100) / 100;
      const tax = Math.round(gross * 0.05 * 100) / 100;
      const totalDed = pf + tax;
      const net = Math.round((gross - totalDed) * 100) / 100;
      return {
        employeeId: emp.id,
        payrollRunId: run.id,
        companyId,
        basicSalary: basic,
        earnings: [
          { name: "Basic", amount: basic },
          { name: "HRA", amount: hra },
          { name: "DA", amount: da },
        ],
        deductions: [
          { name: "PF", amount: pf },
          { name: "TDS", amount: tax },
        ],
        grossPay: gross,
        totalDeductions: totalDed,
        netPay: net,
        status: "DRAFT" as const,
      };
    });

  const totalEarnings = payslipData.reduce((s, p) => s + p.grossPay, 0);
  const totalDeductions = payslipData.reduce((s, p) => s + p.totalDeductions, 0);
  const totalNetPay = payslipData.reduce((s, p) => s + p.netPay, 0);

  await prisma.$transaction(async (tx) => {
    await tx.payrollRun.update({
      where: { id: run.id },
      data: {
        status: "PROCESSING" as any,
        processedById: processedByEmployeeId,
        processedAt: new Date(),
      },
    });
    for (const ps of payslipData) {
      await tx.payslip.create({ data: ps });
    }
    await tx.payrollRun.update({
      where: { id: run.id },
      data: {
        status: "COMPLETED" as any,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        totalDeductions: Math.round(totalDeductions * 100) / 100,
        totalNetPay: Math.round(totalNetPay * 100) / 100,
        employeeCount: payslipData.length,
      },
    });
  });

  return run;
}

async function seedHrAndPerformanceDemo(companyId: string, employees: Employee[], hrManager: Employee) {
  const year = new Date().getFullYear();

  const hrRecords = employees.flatMap((employee, index) => {
    const records = [];
    for (let dayOffset = -6; dayOffset <= -1; dayOffset++) {
      let status: AttendanceStatus = AttendanceStatus.PRESENT;
      if (index === 2 && (dayOffset === -3 || dayOffset === -4)) {
        status = AttendanceStatus.ABSENT;
      } else if (index === 4 && dayOffset === -2) {
        status = AttendanceStatus.HALF_DAY;
      } else if (index === 5 && dayOffset === -5) {
        status = AttendanceStatus.ABSENT;
      }
      records.push(
        prisma.attendance.create({
          data: {
            employeeId: employee.id,
            companyId,
            date: daysFromNow(dayOffset),
            checkIn: new Date(daysFromNow(dayOffset).setHours(9, 30 + Math.floor(Math.random() * 30), 0, 0)),
            checkOut: status === AttendanceStatus.ABSENT ? undefined : new Date(daysFromNow(dayOffset).setHours(18, 0 + Math.floor(Math.random() * 30), 0, 0)),
            status,
            verified: true,
            verifiedById: hrManager.id,
            verifiedAt: daysFromNow(0),
          },
        }),
      );
    }
    records.push(
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
    );
    return records;
  });

  await Promise.all(hrRecords);

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

async function seedVendorsAndConstruction(companyId: string) {
  const [vendor1, vendor2] = await Promise.all([
    prisma.vendor.create({
      data: {
        companyId,
        name: "Demo - Sharma Construction Supplies",
        contactPerson: "Rohit Sharma",
        phone: "+91-9876543210",
        email: "rohit@demo-sharmaconstruction.com",
        address: "Peenya Industrial Area, Bengaluru",
        gstin: "29ABCDE1234F1Z5",
        status: VendorStatus.ACTIVE,
      },
    }),
    prisma.vendor.create({
      data: {
        companyId,
        name: "Demo - Elite Interiors",
        contactPerson: "Priya Singh",
        phone: "+91-9876543211",
        email: "priya@demo-eliteinteriors.com",
        address: "MG Road, Bengaluru",
        gstin: "29FGHIJ5678K1Z5",
        status: VendorStatus.ACTIVE,
      },
    }),
  ]);

  const [site1, site2] = await Promise.all([
    prisma.constructionSite.create({
      data: {
        companyId,
        name: "Demo - Greenfield Township Phase 1",
        location: "Electronic City Phase 2, Bengaluru",
        status: SiteStatus.PLANNING,
        budget: 500000000,
        description: "Demo - Large township development with multiple residential towers and community amenities",
      },
    }),
    prisma.constructionSite.create({
      data: {
        companyId,
        name: "Demo - Skyline Heights Tower B",
        location: "Whitefield, Bengaluru",
        status: SiteStatus.IN_PROGRESS,
        startDate: daysFromNow(-60),
        budget: 350000000,
        description: "Demo - 25-storey residential tower with premium specifications",
      },
    }),
  ]);

  const [phase1, phase2] = await Promise.all([
    prisma.sitePhase.create({
      data: {
        siteId: site1.id,
        name: "Demo - Foundation Phase",
        description: "Site clearing, excavation, and foundation laying",
        startDate: daysFromNow(15),
        status: SitePhaseStatus.PENDING,
        sortOrder: 1,
      },
    }),
    prisma.sitePhase.create({
      data: {
        siteId: site2.id,
        name: "Demo - Superstructure Phase",
        description: "Column and slab construction for floors 1-10",
        startDate: daysFromNow(-30),
        status: SitePhaseStatus.IN_PROGRESS,
        sortOrder: 1,
      },
    }),
  ]);

  const [material1, material2, material3] = await Promise.all([
    prisma.material.create({
      data: {
        companyId,
        name: "Demo - OPC 53 Grade Cement",
        category: "Cement",
        unit: "Bags",
        unitPrice: 380,
      },
    }),
    prisma.material.create({
      data: {
        companyId,
        name: "Demo - Fe500D TMT Steel Bars",
        category: "Steel",
        unit: "Tonnes",
        unitPrice: 62000,
      },
    }),
    prisma.material.create({
      data: {
        companyId,
        name: "Demo - Premium Vitrified Tiles 600x1200",
        category: "Finishing",
        unit: "Boxes",
        unitPrice: 850,
      },
    }),
  ]);

  await Promise.all([
    prisma.materialInward.create({
      data: {
        companyId,
        vendorId: vendor1.id,
        siteId: site1.id,
        materialId: material1.id,
        quantity: 500,
        unitPrice: 380,
        totalAmount: 190000,
        receivedDate: daysFromNow(-15),
        notes: "Demo - Initial cement supply for foundation work",
      },
    }),
    prisma.materialInward.create({
      data: {
        companyId,
        vendorId: vendor1.id,
        siteId: site2.id,
        materialId: material2.id,
        quantity: 25,
        unitPrice: 62000,
        totalAmount: 1550000,
        receivedDate: daysFromNow(-10),
        notes: "Demo - Steel supply for superstructure",
      },
    }),
    prisma.materialInward.create({
      data: {
        companyId,
        vendorId: vendor2.id,
        siteId: site2.id,
        materialId: material3.id,
        quantity: 200,
        unitPrice: 850,
        totalAmount: 170000,
        receivedDate: daysFromNow(-5),
        notes: "Demo - Vitrified tiles for Tower B flooring",
      },
    }),
  ]);

  await Promise.all([
    prisma.inventoryItem.create({
      data: {
        companyId,
        siteId: site1.id,
        materialId: material1.id,
        quantityOnHand: 200,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        companyId,
        siteId: site2.id,
        materialId: material2.id,
        quantityOnHand: 10,
      },
    }),
  ]);

  await Promise.all([
    prisma.labourEntry.create({
      data: {
        companyId,
        siteId: site1.id,
        labourName: "Demo - Ramesh",
        labourType: LabourType.SKILLED,
        date: daysFromNow(-7),
        hoursWorked: 8,
        wagesAmount: 1200,
        notes: "Demo - Masonry work at foundation site",
      },
    }),
    prisma.labourEntry.create({
      data: {
        companyId,
        siteId: site2.id,
        labourName: "Demo - Suresh",
        labourType: LabourType.UNSKILLED,
        date: daysFromNow(-7),
        hoursWorked: 8,
        wagesAmount: 600,
        notes: "Demo - Material handling at Tower B",
      },
    }),
  ]);

  return { vendors: [vendor1, vendor2], sites: [site1, site2], phases: [phase1, phase2], materials: [material1, material2, material3] };
}

async function seedBrokersAndComplaints(companyId: string, crmData: { customers: { id: string }[]; properties: { id: string }[] }) {
  const [broker1, broker2] = await Promise.all([
    prisma.broker.create({
      data: {
        companyId,
        name: "Demo - Property Junction Brokers",
        companyName: "Property Junction",
        phone: "+91-9876543212",
        email: "info@demo-propertyjunction.com",
        commissionRate: 2.5,
        isActive: true,
      },
    }),
    prisma.broker.create({
      data: {
        companyId,
        name: "Demo - Home Finders Realty",
        companyName: "Home Finders",
        phone: "+91-9876543213",
        email: "info@demo-homefinders.com",
        commissionRate: 1.5,
        isActive: true,
      },
    }),
  ]);

  await Promise.all([
    prisma.complaint.create({
      data: {
        companyId,
        customerId: crmData.customers[0].id,
        propertyId: crmData.properties[0].id,
        subject: "Demo - Delay in property registration documents",
        description: "Customer has been waiting for the sale deed registration for over 2 weeks. RERA compliance docs pending.",
        status: ComplaintStatus.OPEN,
      },
    }),
    prisma.complaint.create({
      data: {
        companyId,
        customerId: crmData.customers[1].id,
        propertyId: crmData.properties[2].id,
        subject: "Demo - Parking allocation not as agreed",
        description: "Covered parking slot number was changed from what was promised in the booking agreement.",
        status: ComplaintStatus.IN_PROGRESS,
      },
    }),
  ]);

  return { brokers: [broker1, broker2] };
}

async function seedCommissionsAndIncentives(companyId: string, bookingId: string, salesManager: Employee, salesAgent: Employee) {
  await Promise.all([
    prisma.pipelineCommission.create({
      data: {
        companyId,
        bookingId,
        employeeId: salesManager.id,
        amount: 50000,
        percentage: 0.56,
        status: CommissionStatus.PENDING,
        notes: "Demo - Commission for booking closure (Commerce Hub)",
      },
    }),
    prisma.pipelineCommission.create({
      data: {
        companyId,
        bookingId,
        employeeId: salesAgent.id,
        amount: 25000,
        percentage: 0.28,
        status: CommissionStatus.APPROVED,
        notes: "Demo - Commission for lead conversion support",
      },
    }),
  ]);

  await Promise.all([
    prisma.incentive.create({
      data: {
        companyId,
        title: "Demo - Q2 Top Performer Award",
        description: "Awarded for the highest quarterly sales achievement across all teams",
        award: "Gold Trophy + Performance Bonus",
        value: 100000,
        opportunityLabel: "Q2 FY2025",
        opportunityType: "Quarterly",
        status: IncentiveStatus.ACTIVE,
        payoutStatus: PayoutStatus.PENDING,
      },
    }),
    prisma.incentive.create({
      data: {
        companyId,
        title: "Demo - Referral Champion Q1",
        description: "Closed the most referral leads in Q1 with highest conversion rate",
        award: "Certificate + Amazon Gift Voucher",
        value: 25000,
        opportunityLabel: "Q1 FY2025",
        opportunityType: "Quarterly",
        status: IncentiveStatus.CLOSED,
        payoutStatus: PayoutStatus.PAID,
        winnerId: salesAgent.id,
      },
    }),
  ]);
}

async function seedPayments(companyId: string, bookingId: string, salesAgent: Employee) {
  await Promise.all([
    prisma.paymentSchedule.create({
      data: {
        bookingId,
        companyId,
        installmentNumber: 1,
        amount: 2670000,
        dueDate: daysFromNow(15),
        status: ScheduleStatus.PENDING,
        notes: "Demo - 30% payment milestone",
      },
    }),
    prisma.paymentSchedule.create({
      data: {
        bookingId,
        companyId,
        installmentNumber: 2,
        amount: 3115000,
        dueDate: daysFromNow(45),
        status: ScheduleStatus.PENDING,
        notes: "Demo - 35% construction linked payment",
      },
    }),
    prisma.paymentSchedule.create({
      data: {
        bookingId,
        companyId,
        installmentNumber: 3,
        amount: 3115000,
        dueDate: daysFromNow(75),
        status: ScheduleStatus.PENDING,
        notes: "Demo - 35% final payment on possession",
      },
    }),
  ]);

  await prisma.paymentEntry.create({
    data: {
      bookingId,
      companyId,
      amount: 500000,
      method: PaymentMethod.ONLINE,
      reference: "NEFT-DEMO-TXN-001",
      paymentDate: daysFromNow(-2),
      notes: "Demo - Initial token payment received via NEFT",
      recordedById: salesAgent.id,
    },
  });

  await prisma.expenseClaim.create({
    data: {
      employeeId: salesAgent.id,
      companyId,
      amount: 15000,
      category: "Travel",
      description: "Demo - Client site visit travel and conveyance expenses for 3 property showings",
      status: ExpenseStatus.PENDING,
      expenseDate: daysFromNow(-5),
      notes: "Demo - Includes cab fares and parking charges",
    },
  });
}

async function seedEodAndEscalation(companyId: string, salesAgent: Employee, salesManager: Employee, leadId: string) {
  await prisma.eodReport.create({
    data: {
      employeeId: salesAgent.id,
      companyId,
      reportDate: daysFromNow(-1),
      accomplishments: "Demo - Visited 3 leads for site visits, closed 1 booking follow-up call, submitted payment collection report",
      challenges: "Demo - Traffic delays between sites; one reschedule request",
      tomorrowPlan: "Demo - Follow up on pending registration docs, meet 2 new walk-in leads",
      status: EodReportStatus.DRAFT,
    },
  });

  const escalationRule = await prisma.escalationRule.create({
    data: {
      companyId,
      name: "Demo - Lead Stale Escalation",
      triggerType: EscalationTriggerType.LEAD_STALE,
      config: { staleDays: 3, notifyAdmin: true },
      level: 1,
      notifyRoles: ["ADMIN", "SALES_MANAGER"],
      isActive: true,
    },
  });

  await prisma.escalationEvent.create({
    data: {
      ruleId: escalationRule.id,
      companyId,
      entityType: "lead",
      entityId: leadId,
      status: EscalationEventStatus.TRIGGERED,
      notes: "Demo - Automated escalation: lead has been in NEGOTIATION status for over 3 days without update",
    },
  });
}

async function seedDevices(companyId: string, salesAgent: Employee) {
  await prisma.deviceRegistration.create({
    data: {
      employeeId: salesAgent.id,
      companyId,
      deviceName: "Demo - Neha's iPhone 15",
      deviceId: "DEMO-DEVICE-IOS-001",
      isTrusted: true,
    },
  });
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

  const opsEmployee = createdEmployees.find((employee) => employee.employeeCode === "OPS-001")!;
  await seedOpsData(company.id, opsEmployee, crm);

  await seedHrAndPerformanceDemo(company.id, createdEmployees, hrEmployee);
  await seedVendorsAndConstruction(company.id);
  await seedBrokersAndComplaints(company.id, crm);
  await seedCommissionsAndIncentives(company.id, crm.booking.id, salesManagerEmployee, salesAgentEmployee);
  await seedPayments(company.id, crm.booking.id, salesAgentEmployee);
  await seedEodAndEscalation(company.id, salesAgentEmployee, salesManagerEmployee, crm.leads[1].id);
  await seedDevices(company.id, salesAgentEmployee);
  await seedPayrollDemo(company.id, createdEmployees.filter((e) => e.salary), hrEmployee.id);

  console.log("Seed completed successfully");
  console.log(`  - 1 company (${company.name})`);
  console.log(`  - ${seedConfig.demoUsers.length} demo users/employees`);
  console.log(`  - ${departments.length} departments`);
  console.log(`  - ${crm.properties.length} properties, ${crm.leads.length} leads, ${crm.customers.length} customers`);
  console.log("  - Site visits, booking, attendance, leave, assignments, performance, vendors, construction, brokers, complaints, commissions, incentives, payments, EOD, escalation, and devices demo rows");
  console.log("  - Demo credentials:");
  for (const user of seedConfig.demoUsers) {
    console.log(`    ${user.email} / ${user.password} (${user.role})`);
  }
}

main()
  .catch((e) => { console.error("Seed failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
