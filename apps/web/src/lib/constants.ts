export type UserRole = "OWNER" | "ADMIN" | "HR_MANAGER" | "ACCOUNTS" | "MANAGER" | "TEAM_LEAD" | "EMPLOYEE" | "FIELD_EMPLOYEE";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: UserRole[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", roles: ["OWNER", "ADMIN", "HR_MANAGER", "ACCOUNTS", "MANAGER", "TEAM_LEAD", "EMPLOYEE", "FIELD_EMPLOYEE"] },
  { label: "Approvals", href: "/dashboard/approvals", icon: "ClipboardCheck", roles: ["OWNER", "ADMIN", "MANAGER"] },

  { label: "Chart of Accounts", href: "/dashboard/chart-of-accounts", icon: "BookOpen", roles: ["OWNER", "ADMIN", "ACCOUNTS"] },
  { label: "Payments", href: "/dashboard/payments", icon: "Banknote", roles: ["OWNER", "ADMIN", "ACCOUNTS"] },
  { label: "Expenses", href: "/dashboard/expenses", icon: "Receipt", roles: ["OWNER", "ADMIN", "ACCOUNTS", "MANAGER", "EMPLOYEE", "FIELD_EMPLOYEE"] },
  { label: "EOD Reports", href: "/dashboard/eod-reports", icon: "ClipboardList", roles: ["OWNER", "ADMIN", "HR_MANAGER", "MANAGER", "TEAM_LEAD", "EMPLOYEE", "FIELD_EMPLOYEE"] },
  { label: "Escalation", href: "/dashboard/escalation", icon: "AlertTriangle", roles: ["OWNER", "ADMIN", "MANAGER", "TEAM_LEAD"] },
  { label: "My Tasks", href: "/dashboard/my-tasks", icon: "CheckSquare", roles: ["EMPLOYEE", "FIELD_EMPLOYEE"] },
  { label: "Tasks", href: "/dashboard/tasks", icon: "ListChecks", roles: ["OWNER", "ADMIN", "HR_MANAGER", "ACCOUNTS", "MANAGER", "TEAM_LEAD"] },
  { label: "Task Reviews", href: "/dashboard/task-reviews", icon: "ClipboardCheck", roles: ["OWNER", "ADMIN", "HR_MANAGER", "MANAGER"] },
  { label: "Properties", href: "/dashboard/properties", icon: "Building2", roles: ["OWNER", "ADMIN", "MANAGER", "EMPLOYEE", "FIELD_EMPLOYEE"] },
  { label: "Leads", href: "/dashboard/leads", icon: "Users", roles: ["OWNER", "ADMIN", "MANAGER", "EMPLOYEE", "FIELD_EMPLOYEE"] },
  { label: "Customers", href: "/dashboard/customers", icon: "Contact", roles: ["OWNER", "ADMIN", "MANAGER", "ACCOUNTS"] },
  { label: "Site Visits", href: "/dashboard/site-visits", icon: "MapPin", roles: ["OWNER", "ADMIN", "MANAGER", "FIELD_EMPLOYEE"] },
  { label: "Bookings", href: "/dashboard/bookings", icon: "FileText", roles: ["OWNER", "ADMIN", "MANAGER", "ACCOUNTS", "EMPLOYEE", "FIELD_EMPLOYEE"] },
  { label: "Quotations", href: "/dashboard/quotations", icon: "Handshake", roles: ["OWNER", "ADMIN", "EMPLOYEE"] },

  { label: "Employees", href: "/dashboard/employees", icon: "UserCircle", roles: ["OWNER", "ADMIN", "HR_MANAGER", "MANAGER", "TEAM_LEAD", "ACCOUNTS"] },
  { label: "Departments", href: "/dashboard/departments", icon: "Building", roles: ["OWNER", "ADMIN", "HR_MANAGER", "MANAGER"] },
  { label: "Designations", href: "/dashboard/designations", icon: "BadgeCheck", roles: ["OWNER", "ADMIN", "HR_MANAGER", "MANAGER"] },
  { label: "Attendance", href: "/dashboard/attendance", icon: "CalendarCheck", roles: ["OWNER", "ADMIN", "HR_MANAGER", "ACCOUNTS", "MANAGER", "TEAM_LEAD", "EMPLOYEE", "FIELD_EMPLOYEE"] },
  { label: "Attendance Corrections", href: "/dashboard/attendance-corrections", icon: "PencilLine", roles: ["OWNER", "ADMIN", "HR_MANAGER", "MANAGER", "TEAM_LEAD", "EMPLOYEE"] },
  { label: "Payroll", href: "/dashboard/payroll", icon: "CircleDollarSign", roles: ["OWNER", "ADMIN", "HR_MANAGER", "ACCOUNTS"] },

  { label: "Construction Sites", href: "/dashboard/construction-sites", icon: "Building2", roles: ["OWNER", "ADMIN", "HR_MANAGER", "ACCOUNTS", "MANAGER", "FIELD_EMPLOYEE"] },
  { label: "Vendors", href: "/dashboard/vendors", icon: "Truck", roles: ["OWNER", "ADMIN", "ACCOUNTS", "MANAGER", "FIELD_EMPLOYEE"] },
  { label: "Materials", href: "/dashboard/materials", icon: "Package", roles: ["OWNER", "ADMIN", "MANAGER", "FIELD_EMPLOYEE"] },
  { label: "Inventory", href: "/dashboard/inventory", icon: "Warehouse", roles: ["OWNER", "ADMIN", "MANAGER", "FIELD_EMPLOYEE"] },
  { label: "Consumption", href: "/dashboard/consumption", icon: "ListChecks", roles: ["OWNER", "ADMIN", "MANAGER", "FIELD_EMPLOYEE"] },
  { label: "Incentives", href: "/dashboard/incentives", icon: "Gift", roles: ["OWNER", "ADMIN", "HR_MANAGER", "ACCOUNTS"] },
  { label: "Labour", href: "/dashboard/labour", icon: "Users", roles: ["OWNER", "ADMIN", "MANAGER", "FIELD_EMPLOYEE"] },

  { label: "Commissions", href: "/dashboard/commissions", icon: "CircleDollarSign", roles: ["OWNER", "ADMIN", "HR_MANAGER", "ACCOUNTS"] },
  { label: "Announcements", href: "/dashboard/announcements", icon: "Megaphone", roles: ["OWNER", "ADMIN", "HR_MANAGER", "ACCOUNTS", "MANAGER", "TEAM_LEAD", "EMPLOYEE", "FIELD_EMPLOYEE"] },
  { label: "Documents", href: "/dashboard/documents", icon: "FolderOpen", roles: ["OWNER", "ADMIN", "HR_MANAGER", "ACCOUNTS", "MANAGER", "TEAM_LEAD", "EMPLOYEE", "FIELD_EMPLOYEE"] },
  { label: "Notifications", href: "/dashboard/notifications", icon: "Bell", roles: ["OWNER", "ADMIN", "HR_MANAGER", "ACCOUNTS", "MANAGER", "TEAM_LEAD", "EMPLOYEE", "FIELD_EMPLOYEE"] },
  { label: "Acknowledgment Center", href: "/dashboard/acknowledgment-center", icon: "CheckCheck", roles: ["OWNER", "ADMIN", "HR_MANAGER", "ACCOUNTS", "MANAGER", "TEAM_LEAD", "EMPLOYEE", "FIELD_EMPLOYEE"] },
  { label: "Complaints", href: "/dashboard/complaints", icon: "MessageSquare", roles: ["OWNER", "ADMIN", "HR_MANAGER", "MANAGER"] },
  { label: "Agreements", href: "/dashboard/agreements", icon: "FileSignature", roles: ["OWNER", "ADMIN", "MANAGER"] },
  { label: "Profitability", href: "/dashboard/profitability", icon: "TrendingUp", roles: ["OWNER", "ADMIN", "ACCOUNTS"] },
  { label: "Recruitment", href: "/dashboard/recruitment", icon: "UserPlus", roles: ["OWNER", "ADMIN", "HR_MANAGER"] },
  { label: "Training", href: "/dashboard/training", icon: "GraduationCap", roles: ["OWNER", "ADMIN", "HR_MANAGER", "MANAGER", "TEAM_LEAD", "EMPLOYEE", "FIELD_EMPLOYEE"] },
  { label: "Assets", href: "/dashboard/assets", icon: "Wrench", roles: ["OWNER", "ADMIN", "HR_MANAGER", "MANAGER"] },
  { label: "Meetings", href: "/dashboard/meetings", icon: "CalendarDays", roles: ["OWNER", "ADMIN", "HR_MANAGER", "MANAGER", "TEAM_LEAD", "EMPLOYEE", "FIELD_EMPLOYEE"] },
  { label: "Devices", href: "/dashboard/devices", icon: "Smartphone", roles: ["OWNER", "ADMIN", "HR_MANAGER", "MANAGER"] },
  { label: "Leave Requests", href: "/dashboard/leave-requests", icon: "CalendarRange", roles: ["OWNER", "ADMIN", "HR_MANAGER", "MANAGER", "TEAM_LEAD", "EMPLOYEE", "FIELD_EMPLOYEE"] },
  { label: "Leave Allocations", href: "/dashboard/leave-allocations", icon: "Coins", roles: ["OWNER", "ADMIN", "HR_MANAGER", "MANAGER"] },

  { label: "Performance", href: "/dashboard/performance", icon: "TrendingUp", roles: ["OWNER", "ADMIN", "HR_MANAGER", "MANAGER", "TEAM_LEAD", "EMPLOYEE", "FIELD_EMPLOYEE"] },
  { label: "EMS", href: "/dashboard/ems", icon: "Activity", roles: ["OWNER", "ADMIN"] },
  { label: "Permissions", href: "/dashboard/permissions", icon: "ShieldCheck", roles: ["OWNER"] },
  { label: "Security", href: "/dashboard/security", icon: "ShieldCheck", roles: ["OWNER", "ADMIN"] },
  { label: "Company", href: "/dashboard/company", icon: "Store", roles: ["OWNER", "ADMIN"] },
  { label: "Reports", href: "/dashboard/reports", icon: "BarChart3", roles: ["OWNER", "ADMIN", "HR_MANAGER", "ACCOUNTS", "MANAGER"] },
  { label: "Export Config", href: "/dashboard/export-configs", icon: "Settings2", roles: ["OWNER", "ADMIN", "ACCOUNTS"] },
  { label: "Users", href: "/dashboard/users", icon: "Shield", roles: ["OWNER", "ADMIN"] },
  { label: "Activity Logs", href: "/dashboard/activity-logs", icon: "History", roles: ["OWNER", "ADMIN"] },
  { label: "Offline Queue", href: "/dashboard/offline-queue", icon: "Database", roles: ["TEAM_LEAD", "EMPLOYEE", "FIELD_EMPLOYEE"] },
  { label: "Settings", href: "/dashboard/settings", icon: "Settings", roles: ["OWNER", "ADMIN"] },
];

export const ROLE_LABELS: Record<UserRole, string> = {
  OWNER: "Business Owner",
  ADMIN: "System Admin",
  HR_MANAGER: "HR Manager",
  ACCOUNTS: "Accounts",
  MANAGER: "Manager",
  TEAM_LEAD: "Team Lead",
  EMPLOYEE: "Office Employee",
  FIELD_EMPLOYEE: "Field Employee",
};
