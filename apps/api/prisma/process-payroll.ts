import { PrismaClient, PayrollRunStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function processPayroll() {
  const draftRun = await prisma.payrollRun.findFirst({
    where: { status: PayrollRunStatus.DRAFT },
  });

  if (!draftRun) {
    console.log("No DRAFT payroll run found");
    return;
  }

  const adminEmployee = await prisma.employee.findFirst({
    where: { employeeCode: "ADM-001" },
  });

  if (!adminEmployee) {
    console.error("Admin employee ADM-001 not found");
    return;
  }

  const companyId = draftRun.companyId;
  const id = draftRun.id;
  const processedById = adminEmployee.id;

  const activeEmployees = await prisma.employee.findMany({
    where: { companyId, status: "ACTIVE" },
    select: { id: true, salary: true },
  });

  if (activeEmployees.length === 0) {
    console.error("No active employees found to process payroll");
    return;
  }

  const payslipData = activeEmployees.map((emp) => {
    const basic = emp.salary ? Number(emp.salary) : 0;
    const hra = Math.round(basic * 0.4 * 100) / 100;
    const da = Math.round(basic * 0.1 * 100) / 100;
    const gross = basic + hra + da;
    const pf = Math.round(Math.min(basic * 0.12, 1800) * 100) / 100;
    const tax = Math.round(gross * 0.05 * 100) / 100;
    const totalDed = pf + tax;
    const net = Math.round((gross - totalDed) * 100) / 100;

    return {
      employeeId: emp.id,
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
      where: { id },
      data: {
        status: PayrollRunStatus.PROCESSING,
        processedById,
        processedAt: new Date(),
      },
    });

    for (const ps of payslipData) {
      await tx.payslip.create({ data: { ...ps, payrollRunId: id } });
    }

    await tx.payrollRun.update({
      where: { id },
      data: {
        status: PayrollRunStatus.COMPLETED,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        totalDeductions: Math.round(totalDeductions * 100) / 100,
        totalNetPay: Math.round(totalNetPay * 100) / 100,
        employeeCount: payslipData.length,
      },
    });
  });

  console.log(`Payroll run ${id} processed successfully`);
  console.log(`  - ${payslipData.length} payslips generated`);
  console.log(`  - Total earnings: ${totalEarnings}`);
  console.log(`  - Total deductions: ${totalDeductions}`);
  console.log(`  - Total net pay: ${totalNetPay}`);
}

processPayroll()
  .catch((e) => { console.error("Failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
