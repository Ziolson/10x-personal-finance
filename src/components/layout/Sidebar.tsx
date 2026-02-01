import React from "react";
import { Home, TrendingUp, DollarSign, BarChart3, Tags, Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "./ThemeToggle";
import { LogoutButton } from "./LogoutButton";
import { cn } from "@/lib/utils";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface SidebarProps {
  /** Current page path for active link highlighting */
  currentPath: string;
  /** User's display name or email */
  userName?: string;
  /** User's avatar URL */
  avatarUrl?: string;
  /** Callback when "Add Transaction" button is clicked */
  onAddTransaction: () => void;
  /** Callback when logout is clicked */
  onLogout?: () => Promise<void>;
  /** Optional CSS class for wrapper */
  className?: string;
}

const navigationItems: NavigationItem[] = [
  { name: "Pulpit", href: "/", icon: <Home className="size-5" /> },
  { name: "Transakcje", href: "/transactions", icon: <TrendingUp className="size-5" /> },
  { name: "Konta", href: "/accounts", icon: <DollarSign className="size-5" /> },
  { name: "Budżety", href: "/budgets", icon: <BarChart3 className="size-5" /> },
  { name: "Kategorie", href: "/categories", icon: <Tags className="size-5" /> },
  { name: "Rekomendacje AI", href: "/insights", icon: <Sparkles className="size-5" /> },
];

/**
 * Sidebar Component - Desktop Navigation
 *
 * Vertical navigation bar displayed on desktop screens.
 * Includes logo/home link, navigation menu, and user profile section at the bottom.
 */
export const Sidebar = React.memo(function Sidebar({ currentPath, userName = "User", avatarUrl, onAddTransaction, onLogout, className }: SidebarProps) {
  const isActive = (href: string) => {
    if (href === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(href);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside
      className={cn("hidden md:flex flex-col h-screen w-64 border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950", className)}
      aria-label="Main navigation"
    >
      {/* Header - Logo and Add Transaction Button */}
      <div className="flex flex-col gap-4 border-b border-neutral-200 p-4 dark:border-neutral-800">
        <a href="/" className="flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-900" aria-label="Go to home">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-white">
            <span className="text-lg font-bold">10x</span>
          </div>
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">Finance</span>
        </a>

        <Button onClick={onAddTransaction} className="w-full gap-2" size="default" aria-label="Add new transaction">
          <Plus className="size-4" />
          <span>Dodaj transakcję</span>
        </Button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto px-2 py-4" role="navigation">
        <ul className="space-y-2">
          {navigationItems.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                  isActive(item.href) ? "bg-primary/10 text-primary dark:bg-primary/20" : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                )}
                aria-current={isActive(item.href) ? "page" : undefined}
              >
                {item.icon}
                <span className="font-medium">{item.name}</span>
                {item.badge && (
                  <span className="ml-auto inline-flex items-center justify-center rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">{item.badge}</span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer - User Profile Section */}
      <div className="border-t border-neutral-200 p-4 dark:border-neutral-800">
        {/* Theme Toggle Button - Always Visible */}
        <div className="mb-4">
          <ThemeToggle className="w-full" size="sm" showLabel />
        </div>

        {/* User Profile */}
        <div className="mb-4 flex items-center gap-3">
          <Avatar>
            {avatarUrl && <AvatarImage src={avatarUrl} alt={userName} />}
            <AvatarFallback>{getInitials(userName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">{userName}</p>
            <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">{userName}</p>
          </div>
        </div>

        {/* Logout Button */}
        <LogoutButton onLogout={onLogout} className="w-full" size="default" showLabel />
      </div>
    </aside>
  );
});

Sidebar.displayName = "Sidebar";
