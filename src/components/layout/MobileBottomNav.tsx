import React from "react";
import { Home, TrendingUp, DollarSign, BarChart3, Tags, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  /** Current page path for active link highlighting */
  currentPath: string;
  /** Callback when "Add Transaction" FAB button is clicked */
  onAddTransaction: () => void;
  /** Optional CSS class for wrapper */
  className?: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const navigationItems: NavItem[] = [
  { name: "Pulpit", href: "/", icon: <Home className="size-5" /> },
  { name: "Transakcje", href: "/transactions", icon: <TrendingUp className="size-5" /> },
  { name: "Konta", href: "/accounts", icon: <DollarSign className="size-5" /> },
  { name: "Budżety", href: "/budgets", icon: <BarChart3 className="size-5" /> },
  { name: "Kategorie", href: "/categories", icon: <Tags className="size-5" /> },
];

/**
 * MobileBottomNav Component
 *
 * Bottom navigation bar displayed on mobile devices (md:hidden).
 * Sticky positioning at bottom with icon-based navigation items and FAB button.
 */
export const MobileBottomNav = React.memo(function MobileBottomNav({ currentPath, onAddTransaction, className }: MobileBottomNavProps) {
  const isActive = (href: string) => {
    if (href === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(href);
  };

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 flex md:hidden items-center justify-between gap-1 border-t border-neutral-200 bg-white px-2 py-2 dark:border-neutral-800 dark:bg-neutral-950",
        className
      )}
      role="navigation"
      aria-label="Mobile bottom navigation"
    >
      {/* Navigation Items */}
      <div className="flex flex-1 items-center justify-around">
        {navigationItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-lg p-2 transition-all",
              isActive(item.href) ? "text-primary" : "text-neutral-600 dark:text-neutral-400"
            )}
            aria-current={isActive(item.href) ? "page" : undefined}
            title={item.name}
          >
            {item.icon}
            <span className="text-xs font-medium">{item.name}</span>
          </a>
        ))}
      </div>

      {/* FAB - Add Transaction Button */}
      <button
        onClick={onAddTransaction}
        className="ml-2 flex items-center justify-center rounded-full bg-primary p-3 text-white shadow-lg transition-transform active:scale-95"
        aria-label="Add new transaction"
        title="Add transaction"
      >
        <Plus className="size-6" />
      </button>
    </nav>
  );
});

MobileBottomNav.displayName = "MobileBottomNav";
