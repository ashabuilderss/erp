"use client";

import { useSession } from "next-auth/react";
import { useCurrentUser } from "./api/useCurrentUser";
import { UserRole } from "@/lib/constants";

const ROLE_HIERARCHY: Record<UserRole, number> = {
  OWNER: 100,
  ADMIN: 90,
  HR_MANAGER: 80,
  ACCOUNTS: 70,
  MANAGER: 70,
  TEAM_LEAD: 60,
  EMPLOYEE: 50,
  FIELD_EMPLOYEE: 40,
};

export function useRoleCheck(allowedRoles: UserRole[]): boolean {
  const { data: session } = useSession();
  const { data: currentUser } = useCurrentUser();
  const role = (currentUser?.user?.role || session?.user?.role || "EMPLOYEE") as UserRole;

  return allowedRoles.includes(role);
}

export function useMinRole(minRole: UserRole): boolean {
  const { data: session } = useSession();
  const { data: currentUser } = useCurrentUser();
  const role = (currentUser?.user?.role || session?.user?.role || "EMPLOYEE") as UserRole;

  return (ROLE_HIERARCHY[role] || 0) >= (ROLE_HIERARCHY[minRole] || 0);
}

export function useRole(): UserRole {
  const { data: session } = useSession();
  const { data: currentUser } = useCurrentUser();
  return (currentUser?.user?.role || session?.user?.role || "EMPLOYEE") as UserRole;
}
