export type UserRole = "OWNER" | "ADMIN" | "HR_MANAGER" | "EMPLOYEE";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: UserRole[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", roles: ["OWNER", "ADMIN", "HR_MANAGER", "EMPLOYEE"] },
  { label: "Approvals", href: "/dashboard/approvals", icon: "ClipboardCheck", roles: ["OWNER"] },

  { label: "Payments", href: "/dashboard/payments", icon: "Banknote", roles: ["OWNER", "ADMIN"] },
  { label: "Expenses", href: "/dashboard/expenses", icon: "Receipt", roles: ["OWNER", "ADMIN", "EMPLOYEE"] },
  { label: "EOD Reports", href: "/dashboard/eod-reports", icon: "ClipboardList", roles: ["OWNER", "ADMIN", "HR_MANAGER", "EMPLOYEE"] },
  { label: "Escalation", href: "/dashboard/escalation", icon: "AlertTriangle", roles: ["OWNER", "ADMIN"] },
  { label: "My Tasks", href: "/dashboard/my-tasks", icon: "CheckSquare", roles: ["EMPLOYEE"] },
  { label: "Properties", href: "/dashboard/properties", icon: "Building2", roles: ["OWNER", "ADMIN", "EMPLOYEE"] },
  { label: "Leads", href: "/dashboard/leads", icon: "Users", roles: ["OWNER", "ADMIN", "EMPLOYEE"] },
  { label: "Customers", href: "/dashboard/customers", icon: "Contact", roles: ["OWNER", "ADMIN"] },
  { label: "Site Visits", href: "/dashboard/site-visits", icon: "MapPin", roles: ["OWNER", "ADMIN", "EMPLOYEE"] },
  { label: "Bookings", href: "/dashboard/bookings", icon: "FileText", roles: ["OWNER", "ADMIN", "EMPLOYEE"] },

  { label: "Employees", href: "/dashboard/employees", icon: "UserCircle", roles: ["OWNER", "ADMIN", "HR_MANAGER"] },
  { label: "Departments", href: "/dashboard/departments", icon: "Building", roles: ["OWNER", "ADMIN", "HR_MANAGER"] },
  { label: "Designations", href: "/dashboard/designations", icon: "BadgeCheck", roles: ["OWNER", "ADMIN", "HR_MANAGER"] },
  { label: "Attendance", href: "/dashboard/attendance", icon: "CalendarCheck", roles: ["OWNER", "ADMIN", "HR_MANAGER", "EMPLOYEE"] },
  { label: "Attendance Corrections", href: "/dashboard/attendance-corrections", icon: "PencilLine", roles: ["OWNER", "ADMIN", "HR_MANAGER", "EMPLOYEE"] },
  { label: "Payroll", href: "/dashboard/payroll", icon: "CircleDollarSign", roles: ["OWNER", "ADMIN", "HR_MANAGER", "EMPLOYEE"] },

  { label: "Construction Sites", href: "/dashboard/construction-sites", icon: "Building2", roles: ["OWNER", "ADMIN", "HR_MANAGER", "EMPLOYEE"] },
  { label: "Vendors", href: "/dashboard/vendors", icon: "Truck", roles: ["OWNER", "ADMIN", "HR_MANAGER", "EMPLOYEE"] },
  { label: "Materials", href: "/dashboard/materials", icon: "Package", roles: ["OWNER", "ADMIN", "HR_MANAGER", "EMPLOYEE"] },
  { label: "Inventory", href: "/dashboard/inventory", icon: "Warehouse", roles: ["OWNER", "ADMIN", "HR_MANAGER", "EMPLOYEE"] },
  { label: "Incentives", href: "/dashboard/incentives", icon: "Gift", roles: ["OWNER", "ADMIN", "HR_MANAGER", "EMPLOYEE"] },
  { label: "Labour", href: "/dashboard/labour", icon: "Users", roles: ["OWNER", "ADMIN", "HR_MANAGER", "EMPLOYEE"] },

  { label: "Brokers", href: "/dashboard/brokers", icon: "Handshake", roles: ["OWNER", "ADMIN"] },
  { label: "Dealers", href: "/dashboard/dealers", icon: "Store", roles: ["OWNER", "ADMIN"] },
  { label: "Commissions", href: "/dashboard/commissions", icon: "CircleDollarSign", roles: ["OWNER", "ADMIN", "HR_MANAGER", "EMPLOYEE"] },
  { label: "Complaints", href: "/dashboard/complaints", icon: "MessageSquare", roles: ["OWNER", "ADMIN", "HR_MANAGER"] },
  { label: "Devices", href: "/dashboard/devices", icon: "Smartphone", roles: ["OWNER", "ADMIN", "HR_MANAGER", "EMPLOYEE"] },
  { label: "Leave Requests", href: "/dashboard/leave-requests", icon: "CalendarRange", roles: ["OWNER", "ADMIN", "HR_MANAGER", "EMPLOYEE"] },
  { label: "Leave Allocations", href: "/dashboard/leave-allocations", icon: "Coins", roles: ["OWNER", "ADMIN", "HR_MANAGER"] },

  { label: "EMS", href: "/dashboard/ems", icon: "Activity", roles: ["OWNER", "ADMIN"] },
  { label: "Permissions", href: "/dashboard/permissions", icon: "ShieldCheck", roles: ["OWNER"] },
  { label: "Reports", href: "/dashboard/reports", icon: "BarChart3", roles: ["OWNER", "ADMIN", "HR_MANAGER"] },
  { label: "Users", href: "/dashboard/users", icon: "Shield", roles: ["OWNER", "ADMIN"] },
  { label: "Activity Logs", href: "/dashboard/activity-logs", icon: "History", roles: ["OWNER", "ADMIN"] },
  { label: "Offline Queue", href: "/dashboard/offline-queue", icon: "Database", roles: ["OWNER", "ADMIN", "HR_MANAGER", "EMPLOYEE"] },
  { label: "Settings", href: "/dashboard/settings", icon: "Settings", roles: ["OWNER", "ADMIN"] },
];

export const ROLE_LABELS: Record<UserRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  HR_MANAGER: "HR Manager",
  EMPLOYEE: "Employee",
};
