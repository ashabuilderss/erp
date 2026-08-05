import { PrismaService } from '../../config/prisma.service';
import { UpdatePermissionGrantsDto } from './dto/update-permission-grants.dto';
export declare class PermissionGrantsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(companyId: string): Promise<({
        usersPermissionGrantsUserIdTousers: {
            role: import(".prisma/client").$Enums.UserRole;
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    } & {
        permission: string;
        id: string;
        createdAt: Date;
        companyId: string;
        deletedAt: Date | null;
        userId: string;
        grantedById: string | null;
        granted: boolean;
    })[]>;
    findByUser(userId: string, companyId: string): Promise<{
        userId: string;
        role: import(".prisma/client").$Enums.UserRole;
        allPermissions: ("user:read" | "user:create" | "user:update" | "user:delete" | "employee:read" | "employee:create" | "employee:update" | "employee:delete" | "employee:view-salary" | "department:read" | "department:create" | "department:update" | "department:delete" | "designation:read" | "designation:create" | "designation:update" | "designation:delete" | "property:read" | "property:create" | "property:update" | "property:delete" | "lead:read" | "lead:create" | "lead:update" | "lead:delete" | "lead:convert" | "lead:followup:read" | "lead:followup:create" | "quotation:read" | "quotation:create" | "quotation:update" | "quotation:download" | "customer:read" | "customer:create" | "customer:update" | "customer:delete" | "site-visit:read" | "site-visit:create" | "site-visit:update" | "site-visit:delete" | "booking:read" | "booking:create" | "booking:update" | "booking:delete" | "attendance:read" | "attendance:create" | "attendance:verify" | "leave:read" | "leave:create" | "leave:approve" | "notification:read" | "notification:send" | "audit-log:read" | "performance:read" | "performance:calculate" | "performance:rate" | "performance:trend" | "performance:leaderboard" | "announcement:read" | "announcement:create" | "announcement:publish" | "announcement:archive" | "document:read" | "document:create" | "document:delete" | "dashboard:view" | "report:view" | "report:export" | "export-config:read" | "export-config:manage" | "export-sheet:sync" | "export:download" | "export:history" | "analytics:view" | "task:assign" | "task:escalate" | "task:completion:acknowledge" | "task:completion:approve" | "approval:read" | "approval:manage" | "payroll:process" | "payroll:hold:create" | "payroll:hold:release" | "warning:read" | "warning:create" | "warning:issue" | "warning:acknowledge" | "export:sensitive" | "attendance:approve" | "deletion:authorize" | "agreement:read" | "agreement:create" | "agreement:approve" | "profitability:view" | "recruitment:read" | "recruitment:create" | "recruitment:update" | "training:read" | "training:create" | "training:acknowledge" | "asset:read" | "asset:create" | "asset:update" | "asset:delete" | "asset:assign" | "asset:repair" | "meeting:read" | "meeting:create" | "meeting:record-mom" | "payment:read" | "payment:create" | "payment:update" | "payment:delete" | "expense:read" | "expense:create" | "expense:approve" | "account:read" | "account:create" | "account:update" | "account:delete" | "commission:read" | "commission:update" | "incentive:read" | "incentive:create" | "payroll:read" | "construction:read" | "construction:create" | "construction:update" | "construction:delete" | "consumption:create" | "consumption:read" | "consumption:delete" | "complaint:read" | "complaint:create" | "complaint:update" | "escalation:read" | "escalation:create" | "escalation:delete" | "assignment:read" | "assignment:create" | "ems:read" | "ems:create" | "company:read" | "company:update" | "eod:read" | "eod:create" | "eod:review" | "security:read" | "security:update" | "device:read" | "device:create" | "device:update" | "device:delete" | "broker:read" | "broker:create" | "broker:update" | "broker:delete" | "inventory:read" | "inventory:create" | "inventory:update" | "inventory:delete")[];
        grants: {
            permission: string;
            granted: boolean;
        }[];
    }>;
    updateUserGrants(userId: string, dto: UpdatePermissionGrantsDto, currentUserId: string, companyId: string): Promise<{
        userId: string;
        role: import(".prisma/client").$Enums.UserRole;
        allPermissions: ("user:read" | "user:create" | "user:update" | "user:delete" | "employee:read" | "employee:create" | "employee:update" | "employee:delete" | "employee:view-salary" | "department:read" | "department:create" | "department:update" | "department:delete" | "designation:read" | "designation:create" | "designation:update" | "designation:delete" | "property:read" | "property:create" | "property:update" | "property:delete" | "lead:read" | "lead:create" | "lead:update" | "lead:delete" | "lead:convert" | "lead:followup:read" | "lead:followup:create" | "quotation:read" | "quotation:create" | "quotation:update" | "quotation:download" | "customer:read" | "customer:create" | "customer:update" | "customer:delete" | "site-visit:read" | "site-visit:create" | "site-visit:update" | "site-visit:delete" | "booking:read" | "booking:create" | "booking:update" | "booking:delete" | "attendance:read" | "attendance:create" | "attendance:verify" | "leave:read" | "leave:create" | "leave:approve" | "notification:read" | "notification:send" | "audit-log:read" | "performance:read" | "performance:calculate" | "performance:rate" | "performance:trend" | "performance:leaderboard" | "announcement:read" | "announcement:create" | "announcement:publish" | "announcement:archive" | "document:read" | "document:create" | "document:delete" | "dashboard:view" | "report:view" | "report:export" | "export-config:read" | "export-config:manage" | "export-sheet:sync" | "export:download" | "export:history" | "analytics:view" | "task:assign" | "task:escalate" | "task:completion:acknowledge" | "task:completion:approve" | "approval:read" | "approval:manage" | "payroll:process" | "payroll:hold:create" | "payroll:hold:release" | "warning:read" | "warning:create" | "warning:issue" | "warning:acknowledge" | "export:sensitive" | "attendance:approve" | "deletion:authorize" | "agreement:read" | "agreement:create" | "agreement:approve" | "profitability:view" | "recruitment:read" | "recruitment:create" | "recruitment:update" | "training:read" | "training:create" | "training:acknowledge" | "asset:read" | "asset:create" | "asset:update" | "asset:delete" | "asset:assign" | "asset:repair" | "meeting:read" | "meeting:create" | "meeting:record-mom" | "payment:read" | "payment:create" | "payment:update" | "payment:delete" | "expense:read" | "expense:create" | "expense:approve" | "account:read" | "account:create" | "account:update" | "account:delete" | "commission:read" | "commission:update" | "incentive:read" | "incentive:create" | "payroll:read" | "construction:read" | "construction:create" | "construction:update" | "construction:delete" | "consumption:create" | "consumption:read" | "consumption:delete" | "complaint:read" | "complaint:create" | "complaint:update" | "escalation:read" | "escalation:create" | "escalation:delete" | "assignment:read" | "assignment:create" | "ems:read" | "ems:create" | "company:read" | "company:update" | "eod:read" | "eod:create" | "eod:review" | "security:read" | "security:update" | "device:read" | "device:create" | "device:update" | "device:delete" | "broker:read" | "broker:create" | "broker:update" | "broker:delete" | "inventory:read" | "inventory:create" | "inventory:update" | "inventory:delete")[];
        grants: {
            permission: string;
            granted: boolean;
        }[];
    }>;
}
