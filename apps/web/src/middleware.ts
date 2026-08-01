import { auth } from "@/lib/auth";

const ROLE_ROUTES: Record<string, string[]> = {
  "/dashboard/permissions": ["OWNER"],
  "/dashboard/users": ["OWNER", "ADMIN"],
  "/dashboard/settings": ["OWNER", "ADMIN"],
  "/dashboard/activity-logs": ["OWNER", "ADMIN"],
  "/dashboard/ems": ["OWNER", "ADMIN"],
  "/dashboard/export-configs": ["OWNER", "ADMIN", "ACCOUNTS"],
  "/dashboard/payroll": ["OWNER", "ADMIN", "HR_MANAGER", "ACCOUNTS"],
  "/dashboard/payroll-holds": ["OWNER", "ADMIN", "HR_MANAGER"],
  "/dashboard/chart-of-accounts": ["OWNER", "ADMIN", "ACCOUNTS"],
  "/dashboard/payments": ["OWNER", "ADMIN", "ACCOUNTS"],
  "/dashboard/commissions": ["OWNER", "ADMIN", "HR_MANAGER", "ACCOUNTS"],
  "/dashboard/profitability": ["OWNER", "ADMIN", "ACCOUNTS"],
  "/dashboard/customers": ["OWNER", "ADMIN", "MANAGER", "ACCOUNTS"],
  "/dashboard/reports": ["OWNER", "ADMIN", "HR_MANAGER", "ACCOUNTS", "MANAGER"],
  "/dashboard/recruitment": ["OWNER", "ADMIN", "HR_MANAGER"],
  "/dashboard/employees": ["OWNER", "ADMIN", "HR_MANAGER", "MANAGER", "TEAM_LEAD", "ACCOUNTS"],
  "/dashboard/departments": ["OWNER", "ADMIN", "HR_MANAGER", "MANAGER"],
  "/dashboard/designations": ["OWNER", "ADMIN", "HR_MANAGER", "MANAGER"],
  "/dashboard/leave-allocations": ["OWNER", "ADMIN", "HR_MANAGER", "MANAGER"],
  "/dashboard/tasks": ["OWNER", "ADMIN", "HR_MANAGER", "ACCOUNTS", "MANAGER", "TEAM_LEAD"],
  "/dashboard/task-reviews": ["OWNER", "ADMIN", "HR_MANAGER", "MANAGER"],
  "/dashboard/my-tasks": ["EMPLOYEE", "FIELD_EMPLOYEE"],
  "/dashboard/offline-queue": ["TEAM_LEAD", "EMPLOYEE", "FIELD_EMPLOYEE"],
  "/dashboard/approvals": ["OWNER", "ADMIN", "MANAGER"],
  "/dashboard/expenses": ["OWNER", "ADMIN", "ACCOUNTS", "MANAGER", "EMPLOYEE", "FIELD_EMPLOYEE"],
  "/dashboard/eod-reports": ["OWNER", "ADMIN", "HR_MANAGER", "MANAGER", "TEAM_LEAD", "EMPLOYEE", "FIELD_EMPLOYEE"],
  "/dashboard/escalation": ["OWNER", "ADMIN", "MANAGER", "TEAM_LEAD"],
  "/dashboard/properties": ["OWNER", "ADMIN", "MANAGER", "EMPLOYEE", "FIELD_EMPLOYEE"],
  "/dashboard/leads": ["OWNER", "ADMIN", "MANAGER", "EMPLOYEE", "FIELD_EMPLOYEE"],
  "/dashboard/site-visits": ["OWNER", "ADMIN", "MANAGER", "FIELD_EMPLOYEE"],
  "/dashboard/bookings": ["OWNER", "ADMIN", "MANAGER", "ACCOUNTS", "EMPLOYEE", "FIELD_EMPLOYEE"],
  "/dashboard/brokers": ["OWNER", "ADMIN", "MANAGER", "EMPLOYEE"],
  "/dashboard/attendance": ["OWNER", "ADMIN", "HR_MANAGER", "ACCOUNTS", "MANAGER", "TEAM_LEAD", "EMPLOYEE", "FIELD_EMPLOYEE"],
  "/dashboard/attendance-corrections": ["OWNER", "ADMIN", "HR_MANAGER", "MANAGER", "TEAM_LEAD", "EMPLOYEE"],
  "/dashboard/construction-sites": ["OWNER", "ADMIN", "HR_MANAGER", "ACCOUNTS", "MANAGER", "FIELD_EMPLOYEE"],
  "/dashboard/location-evidence": ["OWNER", "ADMIN", "HR_MANAGER", "ACCOUNTS", "MANAGER", "TEAM_LEAD", "EMPLOYEE", "FIELD_EMPLOYEE"],
  "/dashboard/vendors": ["OWNER", "ADMIN", "ACCOUNTS", "MANAGER", "FIELD_EMPLOYEE"],
  "/dashboard/materials": ["OWNER", "ADMIN", "MANAGER", "FIELD_EMPLOYEE"],
  "/dashboard/inventory": ["OWNER", "ADMIN", "MANAGER", "FIELD_EMPLOYEE"],
  "/dashboard/consumption": ["OWNER", "ADMIN", "MANAGER", "FIELD_EMPLOYEE"],
  "/dashboard/incentives": ["OWNER", "ADMIN", "HR_MANAGER", "ACCOUNTS"],
  "/dashboard/labour": ["OWNER", "ADMIN", "MANAGER", "FIELD_EMPLOYEE"],
  "/dashboard/announcements": ["OWNER", "ADMIN", "HR_MANAGER", "ACCOUNTS", "MANAGER", "TEAM_LEAD", "EMPLOYEE", "FIELD_EMPLOYEE"],
  "/dashboard/documents": ["OWNER", "ADMIN", "HR_MANAGER", "ACCOUNTS", "MANAGER", "TEAM_LEAD", "EMPLOYEE", "FIELD_EMPLOYEE"],
  "/dashboard/notifications": ["OWNER", "ADMIN", "HR_MANAGER", "ACCOUNTS", "MANAGER", "TEAM_LEAD", "EMPLOYEE", "FIELD_EMPLOYEE"],
  "/dashboard/acknowledgment-center": ["OWNER", "ADMIN", "HR_MANAGER", "ACCOUNTS", "MANAGER", "TEAM_LEAD", "EMPLOYEE", "FIELD_EMPLOYEE"],
  "/dashboard/complaints": ["OWNER", "ADMIN", "HR_MANAGER", "MANAGER"],
  "/dashboard/agreements": ["OWNER", "ADMIN", "MANAGER"],
  "/dashboard/training": ["OWNER", "ADMIN", "HR_MANAGER", "MANAGER", "TEAM_LEAD", "EMPLOYEE", "FIELD_EMPLOYEE"],
  "/dashboard/assets": ["OWNER", "ADMIN", "HR_MANAGER", "MANAGER"],
  "/dashboard/meetings": ["OWNER", "ADMIN", "HR_MANAGER", "MANAGER", "TEAM_LEAD", "EMPLOYEE", "FIELD_EMPLOYEE"],
  "/dashboard/warnings": ["OWNER", "ADMIN", "HR_MANAGER", "ACCOUNTS", "MANAGER", "TEAM_LEAD", "EMPLOYEE", "FIELD_EMPLOYEE"],
  "/dashboard/devices": ["OWNER", "ADMIN", "HR_MANAGER", "MANAGER"],
  "/dashboard/leave-requests": ["OWNER", "ADMIN", "HR_MANAGER", "MANAGER", "TEAM_LEAD", "EMPLOYEE", "FIELD_EMPLOYEE"],
  "/dashboard/performance": ["OWNER", "ADMIN", "HR_MANAGER", "MANAGER", "TEAM_LEAD", "EMPLOYEE", "FIELD_EMPLOYEE"],
  "/dashboard/security": ["OWNER", "ADMIN"],
  "/dashboard/company": ["OWNER", "ADMIN"],
  "/dashboard/quotations": ["OWNER", "ADMIN", "EMPLOYEE"],
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/api/health";

  if (!isPublic && !req.auth) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(signInUrl);
  }

  if (req.auth) {
    const role = req.auth.user?.role as string;
    const matchedRoute = Object.entries(ROLE_ROUTES).find(([route]) =>
      pathname === route || pathname.startsWith(route + "/")
    );

    if (matchedRoute) {
      const [, allowedRoles] = matchedRoute;
      if (!allowedRoles.includes(role)) {
        const dashboardUrl = new URL("/dashboard", req.url);
        return Response.redirect(dashboardUrl);
      }
    }
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
