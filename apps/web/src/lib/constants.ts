export type UserRole = "ADMIN" | "HR_MANAGER" | "EMPLOYEE";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: UserRole[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", roles: ["ADMIN", "HR_MANAGER", "EMPLOYEE"] },

  { label: "My Tasks", href: "/dashboard/my-tasks", icon: "CheckSquare", roles: ["EMPLOYEE"] },
  { label: "Properties", href: "/dashboard/properties", icon: "Building2", roles: ["ADMIN", "EMPLOYEE"] },
  { label: "Leads", href: "/dashboard/leads", icon: "Users", roles: ["ADMIN", "EMPLOYEE"] },
  { label: "Customers", href: "/dashboard/customers", icon: "Contact", roles: ["ADMIN"] },
  { label: "Site Visits", href: "/dashboard/site-visits", icon: "MapPin", roles: ["ADMIN", "EMPLOYEE"] },
  { label: "Bookings", href: "/dashboard/bookings", icon: "FileText", roles: ["ADMIN", "EMPLOYEE"] },

  { label: "Employees", href: "/dashboard/employees", icon: "UserCircle", roles: ["ADMIN", "HR_MANAGER"] },
  { label: "Departments", href: "/dashboard/departments", icon: "Building", roles: ["ADMIN", "HR_MANAGER"] },
  { label: "Designations", href: "/dashboard/designations", icon: "BadgeCheck", roles: ["ADMIN", "HR_MANAGER"] },
  { label: "Attendance", href: "/dashboard/attendance", icon: "CalendarCheck", roles: ["ADMIN", "HR_MANAGER", "EMPLOYEE"] },
  { label: "Leave Requests", href: "/dashboard/leave-requests", icon: "CalendarRange", roles: ["ADMIN", "HR_MANAGER", "EMPLOYEE"] },
  { label: "Leave Allocations", href: "/dashboard/leave-allocations", icon: "Coins", roles: ["ADMIN", "HR_MANAGER"] },

  { label: "EMS", href: "/dashboard/ems", icon: "Activity", roles: ["ADMIN"] },
  { label: "Reports", href: "/dashboard/reports", icon: "BarChart3", roles: ["ADMIN", "HR_MANAGER"] },
  { label: "Users", href: "/dashboard/users", icon: "Shield", roles: ["ADMIN"] },
  { label: "Activity Logs", href: "/dashboard/activity-logs", icon: "History", roles: ["ADMIN"] },
  { label: "Settings", href: "/dashboard/settings", icon: "Settings", roles: ["ADMIN"] },
];

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  HR_MANAGER: "HR Manager",
  EMPLOYEE: "Employee",
};
