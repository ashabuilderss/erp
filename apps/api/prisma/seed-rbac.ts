import { PrismaClient, PermissionScope, UserRole } from "@prisma/client";

const PERMISSION_ACTIONS = [
  "user:read", "user:create", "user:update", "user:delete",
  "employee:read", "employee:create", "employee:update", "employee:delete", "employee:view-salary",
  "department:read", "department:create", "department:update", "department:delete",
  "designation:read", "designation:create", "designation:update", "designation:delete",
  "property:read", "property:create", "property:update", "property:delete",
  "lead:read", "lead:create", "lead:update", "lead:delete", "lead:convert",
  "lead:followup:read", "lead:followup:create",
  "quotation:read", "quotation:create", "quotation:update", "quotation:download",
  "customer:read", "customer:create", "customer:update", "customer:delete",
  "site-visit:read", "site-visit:create", "site-visit:update", "site-visit:delete",
  "booking:read", "booking:create", "booking:update", "booking:delete",
  "attendance:read", "attendance:create", "attendance:verify",
  "leave:read", "leave:create", "leave:approve",
  "notification:read", "notification:send",
  "audit-log:read",
  "performance:read", "performance:calculate", "performance:rate", "performance:trend", "performance:leaderboard",
  "announcement:read", "announcement:create", "announcement:publish", "announcement:archive",
  "document:read", "document:create", "document:delete",
  "dashboard:view", "report:view", "report:export",
  "export-config:read", "export-config:manage", "export-sheet:sync",
  "export:download", "export:history", "analytics:view",
  "task:assign", "task:escalate",
  "approval:read", "approval:manage",
  "payroll:process", "payroll:read", "payroll:hold:create", "payroll:hold:release",
  "warning:read", "warning:create", "warning:issue", "warning:acknowledge",
  "export:sensitive", "attendance:approve", "deletion:authorize",
  "agreement:read", "agreement:create", "agreement:approve",
  "profitability:view",
  "recruitment:read", "recruitment:create", "recruitment:update",
  "training:read", "training:create", "training:acknowledge",
  "asset:read", "asset:create", "asset:update", "asset:delete", "asset:assign", "asset:repair",
  "meeting:read", "meeting:create", "meeting:record-mom",
  "payment:read", "payment:create", "payment:update", "payment:delete",
  "expense:read", "expense:create", "expense:approve",
  "commission:read", "commission:update",
  "incentive:read", "incentive:create",
  "construction:read", "construction:create", "construction:update", "construction:delete",
  "consumption:read", "consumption:create", "consumption:delete",
  "account:read", "account:create", "account:update", "account:delete",
  "complaint:read", "complaint:create", "complaint:update",
  "escalation:read", "escalation:create", "escalation:delete",
  "assignment:read", "assignment:create",
  "ems:read", "ems:create",
  "company:read", "company:update",
  "eod:read", "eod:create", "eod:review",
  "security:read", "security:update",
  "device:read", "device:create", "device:update", "device:delete",
  "broker:read", "broker:create", "broker:update", "broker:delete",
  "inventory:read", "inventory:create", "inventory:update", "inventory:delete",
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  OWNER: PERMISSION_ACTIONS,
  ADMIN: PERMISSION_ACTIONS,
  HR_MANAGER: [
    "dashboard:view", "report:view", "report:export", "analytics:view",
    "employee:read", "employee:create", "employee:update", "employee:view-salary",
    "department:read", "department:create", "department:update",
    "designation:read", "designation:create", "designation:update",
    "leave:read", "leave:create", "leave:approve",
    "attendance:read", "attendance:create", "attendance:verify",
    "notification:read", "notification:send",
    "user:read", "audit-log:read",
    "performance:read", "performance:calculate", "performance:rate", "performance:trend", "performance:leaderboard",
    "announcement:read", "announcement:create", "announcement:publish", "announcement:archive",
    "document:read", "document:create", "document:delete",
    "export-config:read", "export-config:manage",
    "payroll:read", "payroll:process", "payroll:hold:create", "payroll:hold:release",
    "warning:issue", "warning:acknowledge", "warning:read", "warning:create",
    "expense:read", "expense:approve",
    "commission:read", "commission:update",
    "incentive:read", "incentive:create",
    "construction:read", "construction:create",
    "consumption:read", "consumption:create",
    "eod:read", "eod:create", "eod:review",
    "complaint:read", "complaint:create", "complaint:update",
    "device:read", "device:create", "device:update",
    "ems:read", "ems:create",
    "inventory:read", "inventory:create", "inventory:update",
    "property:read", "lead:read", "lead:followup:read",
    "customer:read", "broker:read",
    "site-visit:read", "booking:read",
    "training:read", "training:create", "training:acknowledge",
    "asset:read", "asset:create", "asset:update", "asset:delete", "asset:assign", "asset:repair",
    "meeting:read", "meeting:create", "meeting:record-mom",
    "agreement:read", "agreement:create", "agreement:approve",
    "recruitment:read", "recruitment:create", "recruitment:update",
    "company:read",
  ],
  ACCOUNTS: [
    "dashboard:view", "report:view", "report:export", "analytics:view",
    "employee:read", "employee:view-salary",
    "leave:read", "attendance:read",
    "performance:read",
    "announcement:read", "document:read",
    "export-config:read", "export:download", "export:history",
    "payment:read", "payment:create", "payment:update",
    "expense:read", "expense:create", "expense:approve",
    "commission:read", "broker:read",
    "payroll:read", "payroll:process",
    "construction:read",
    "account:read", "account:create", "account:update", "account:delete",
    "inventory:read", "inventory:create",
    "asset:read",
    "profitability:view",
  ],
  MANAGER: [
    "dashboard:view", "analytics:view",
    "employee:read",
    "leave:read", "leave:create", "leave:approve",
    "attendance:read", "attendance:verify",
    "performance:read", "performance:rate",
    "announcement:read", "document:read",
    "construction:read",
    "consumption:read", "consumption:create", "consumption:delete",
    "eod:read", "eod:create", "eod:review",
    "complaint:read", "complaint:create", "complaint:update",
    "device:read",
    "inventory:read", "inventory:create",
    "property:read",
    "designation:read", "designation:create", "designation:update",
    "department:read", "department:create", "department:update",
    "training:read", "training:create", "training:acknowledge",
    "asset:read",
    "meeting:read", "meeting:create",
    "agreement:read", "agreement:approve",
    "lead:read",
    "notification:read",
    "customer:read", "broker:read", "broker:create",
    "site-visit:read", "booking:read",
    "task:assign", "task:escalate",
    "warning:read", "warning:create", "warning:issue",
    "approval:read",
  ],
  TEAM_LEAD: [
    "dashboard:view",
    "employee:read",
    "attendance:read", "attendance:verify",
    "performance:read",
    "announcement:read", "document:read",
    "property:read", "lead:read",
    "leave:create",
    "training:read", "training:acknowledge",
    "meeting:read",
    "notification:read",
    "eod:read",
    "device:read",
    "task:assign",
    "warning:read",
    "approval:read",
    "inventory:read",
  ],
  EMPLOYEE: [
    "dashboard:view", "analytics:view",
    "employee:read",
    "property:read",
    "lead:read", "lead:create", "lead:update", "lead:convert",
    "lead:followup:read", "lead:followup:create",
    "quotation:read", "quotation:create",
    "customer:read", "customer:create", "customer:update",
    "broker:read", "broker:create", "broker:update",
    "site-visit:read", "site-visit:create", "site-visit:update",
    "booking:read", "booking:create",
    "attendance:read", "attendance:create",
    "leave:read", "leave:create",
    "notification:read",
    "performance:read", "performance:trend", "performance:leaderboard",
    "announcement:read", "document:read", "document:create",
    "eod:read", "eod:create",
    "device:read", "device:create",
    "ems:read", "ems:create",
    "inventory:read",
    "incentive:read",
    "training:read", "training:acknowledge",
    "meeting:read",
    "warning:read", "warning:acknowledge",
    "task:assign",
  ],
  FIELD_EMPLOYEE: [
    "dashboard:view",
    "employee:read",
    "property:read",
    "lead:read", "lead:create", "lead:update",
    "lead:followup:read", "lead:followup:create",
    "site-visit:read", "site-visit:create", "site-visit:update",
    "attendance:read", "attendance:create",
    "leave:read", "leave:create",
    "notification:read",
    "announcement:read", "document:read", "document:create",
    "eod:read", "eod:create",
    "device:read", "device:create",
    "construction:read",
    "consumption:read", "consumption:create",
    "inventory:read",
    "training:read", "training:acknowledge",
    "task:assign",
  ],
};

export async function seedRbac(prisma: PrismaClient, companyId: string) {
  console.log("Seeding RBAC tables...");

  const permMap: Record<string, string> = {};

  for (const action of PERMISSION_ACTIONS) {
    const perm = await prisma.permission.upsert({
      where: { action },
      update: { description: `${action} permission` },
      create: { action, description: `${action} permission` },
    });
    permMap[action] = perm.id;
  }
  console.log(`  Upserted ${PERMISSION_ACTIONS.length} permissions`);

  const roleIds: Record<string, string> = {};
  const roleNames = Object.keys(ROLE_PERMISSIONS) as UserRole[];

  for (const name of roleNames) {
    const role = await prisma.role.upsert({
      where: { companyId_name: { companyId, name } },
      update: { isSystem: true, description: `System ${name} role` },
      create: { companyId, name, isSystem: true, description: `System ${name} role` },
    });
    roleIds[name] = role.id;
  }
  console.log(`  Upserted ${roleNames.length} roles`);

  const scope = PermissionScope.COMPANY;

  for (const [roleName, actions] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleIds[roleName];
    let count = 0;
    for (const action of actions) {
      const permissionId = permMap[action];
      if (!permissionId) {
        console.warn(`  WARNING: Permission action "${action}" not found for role ${roleName}`);
        continue;
      }
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: { scope },
        create: { companyId, roleId, permissionId, scope },
      });
      count++;
    }
    console.log(`  Linked ${count} permissions to ${roleName} role`);
  }

  const users = await prisma.user.findMany({ where: { companyId } });
  let updatedCount = 0;
  for (const user of users) {
    const roleName = user.role as string;
    const roleId = roleIds[roleName];
    if (roleId && user.roleId !== roleId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { roleId },
      });
      updatedCount++;
    }
  }
  console.log(`  Updated roleId for ${updatedCount} users`);

  console.log("RBAC seed complete.");
}
