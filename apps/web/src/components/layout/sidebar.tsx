"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  Contact,
  MapPin,
  FileText,
  UserCircle,
  Building,
  BadgeCheck,
  CalendarCheck,
  CalendarRange,
  Activity,
  BarChart3,
  Settings,
  ChevronLeft,
  History,
  Shield,
  Coins,
  CheckSquare,
  ClipboardCheck,
  ShieldCheck,
  Banknote,
  Receipt,
  ClipboardList,
  AlertTriangle,
  Smartphone,
  PencilLine,
  CircleDollarSign,
  Truck,
  Package,
  Warehouse,
  Handshake,
  Store,
  MessageSquare,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Building2,
  Users,
  Contact,
  MapPin,
  FileText,
  UserCircle,
  Building,
  BadgeCheck,
  CalendarCheck,
  CalendarRange,
  Activity,
  BarChart3,
  Settings,
  History,
  Shield,
  Coins,
  CheckSquare,
  ClipboardCheck,
  ShieldCheck,
  Banknote,
  Receipt,
  ClipboardList,
  AlertTriangle,
  Smartphone,
  PencilLine,
  CircleDollarSign,
  Truck,
  Package,
  Warehouse,
  Handshake,
  Store,
  MessageSquare,
  Database,
};

interface SidebarProps {
  role: "OWNER" | "ADMIN" | "HR_MANAGER" | "EMPLOYEE";
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-sidebar transition-all duration-200",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex h-14 items-center border-b px-4">
        <div className={cn("flex items-center gap-2", collapsed && "justify-center w-full")}>
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <span className="text-sm font-bold text-primary-foreground">R</span>
          </div>
          {!collapsed && (
            <span className="font-semibold text-sidebar-foreground">RealEstate</span>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {visibleItems.map((item) => {
          const Icon = iconMap[item.icon] || LayoutDashboard;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-2"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center text-sidebar-foreground"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>
    </aside>
  );
}
