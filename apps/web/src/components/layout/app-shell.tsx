"use client";

import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";
import { PageErrorBoundary } from "@/components/shared/page-error-boundary";

interface AppShellProps {
  children: React.ReactNode;
  role: "OWNER" | "ADMIN" | "HR_MANAGER" | "EMPLOYEE";
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role: "OWNER" | "ADMIN" | "HR_MANAGER" | "EMPLOYEE";
  };
}

export function AppShell({ children, role, user }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav user={user} />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          <PageErrorBoundary>{children}</PageErrorBoundary>
        </main>
      </div>
    </div>
  );
}
