"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationDropdown } from "./notification-dropdown";
import { useNotificationStream } from "@/hooks/api";
import { ROLE_LABELS } from "@/lib/constants";
import { signOut } from "next-auth/react";

import { UserRole } from "@/lib/constants";

interface TopNavProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
  };
  onMenuClick?: () => void;
}
  async function handleSignOut() {
    await signOut({ redirect: false });
    window.location.assign("/sign-in");
  }


export function TopNav({ user, onMenuClick }: TopNavProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  useNotificationStream();

  const isDark = resolvedTheme === "dark";
  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-2">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}
        <h1 className="text-lg font-semibold text-card-foreground">
          {ROLE_LABELS[user.role]} Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        <NotificationDropdown />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {user.firstName[0]}{user.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-card-foreground max-w-[120px] truncate">
              {user.firstName} {user.lastName}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
