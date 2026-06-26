import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const company = await prisma.company.findFirst();
  if (!company) { console.log('No company found'); return; }
  const cid = company.id;
  
  console.log('Company:', company.name);
  
  const models = [
    'User', 'Employee', 'Property', 'Customer', 'Lead', 'Booking',
    'Broker', 'Complaint', 'PipelineCommission', 'Incentive',
    'ConstructionSite', 'Vendor', 'Material', 'InventoryItem',
    'LabourEntry', 'Attendance', 'PayrollRun', 'ExpenseClaim',
    'PaymentEntry', 'EodReport', 'EscalationEvent', 'ActivityLog',
    'Designation', 'Department', 'LeaveRequest', 'LeaveAllocation',
    'EmployeeAssignment', 'Performance', 'DeviceRegistration',
  ];
  
  for (const model of models) {
    const key = model as keyof typeof prisma;
    if (typeof (prisma as any)[key]?.count === 'function') {
      const c = await (prisma as any)[key].count({ where: { companyId: cid } });
      console.log(`  ${model.padEnd(25)} ${c}`);
    }
  }
  
  const employees = await prisma.employee.findMany({ 
    where: { companyId: cid }, 
    include: { user: { select: { email: true, role: true } } } 
  });
  console.log('\nEmployees:');
  employees.forEach(e => console.log('  ', e.employeeCode, '-', e.user?.email || 'NO USER', '-', e.user?.role));
  
  // Check property has assignedToEmployeeId
  const props = await prisma.property.findMany({ where: { companyId: cid }, select: { id: true, title: true, assignedToEmployeeId: true } });
  console.log('\nProperties:');
  props.forEach(p => console.log('  ', p.title, '-> assignedTo:', p.assignedToEmployeeId));
  
  // Check leads
  const leads = await prisma.lead.findMany({ where: { companyId: cid }, select: { id: true, customerName: true, assignedToEmployeeId: true, status: true } });
  console.log('\nLeads:');
  leads.forEach(l => console.log('  ', l.customerName, '-> status:', l.status, '-> assignedTo:', l.assignedToEmployeeId));
  
  // Check commissions
  const commissions = await prisma.pipelineCommission.findMany({ where: { companyId: cid } });
  console.log('\nCommissions:');
  commissions.forEach(c => console.log('  ', 'employeeId:', c.employeeId, 'amount:', c.amount, 'status:', c.status));
  
  // Check incentives  
  const incentives = await prisma.incentive.findMany({ where: { companyId: cid } });
  console.log('\nIncentives:', incentives.length);
  incentives.forEach(i => console.log('  ', i.title, '-', i.status));
  
  //Check specific employee assignments
  const salesEmp = employees.find(e => e.employeeCode === 'SAL-001');
  if (salesEmp) {
    const asgn = await prisma.employeeAssignment.findMany({ where: { employeeId: salesEmp.id } });
    console.log('\nAssignments for SAL-001:', asgn.length);
    asgn.forEach(a => console.log('  ', a.type, '- entity:', a.entityId));
  }
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
