"use client";

import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";
import { PageErrorBoundary } from "@/components/shared/page-error-boundary";
import { UserRole } from "@/lib/constants";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppShellProps {
  children: React.ReactNode;
  role: UserRole;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
  };
}

export function AppShell({ children, role, user }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Mobile sidebar overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar - hidden on mobile, visible on desktop */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-60 transform transition-transform duration-200 md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar role={role} />
      </aside>

      <div className="flex flex-1 flex-col min-h-0">
        <TopNav user={user} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 bg-background p-6">
          <PageErrorBoundary>{children}</PageErrorBoundary>
        </main>
      </div>
    </div>
  );
}
