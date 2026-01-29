import React from "react";
import { UserMenu } from "./UserMenu";
import { cn } from "@/lib/utils";

interface MobileHeaderProps {
  /** User's display name or email */
  userName?: string;
  /** User's avatar URL */
  avatarUrl?: string;
  /** Callback function when logout is clicked */
  onLogout?: () => Promise<void>;
  /** Optional CSS class for wrapper */
  className?: string;
}

/**
 * MobileHeader Component
 *
 * Compact header displayed at the top on mobile devices (md:hidden).
 * Contains logo and user menu dropdown.
 */
export const MobileHeader = React.memo(function MobileHeader({
  userName = "User",
  avatarUrl,
  onLogout,
  className,
}: MobileHeaderProps) {
  return (
    <header
      className={cn(
        "flex md:hidden items-center justify-between gap-4 border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950",
        className
      )}
      role="banner"
    >
      {/* Logo - Link to Home */}
      <a
        href="/"
        className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
        aria-label="Go to home"
      >
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-white">
          <span className="text-sm font-bold">10x</span>
        </div>
        <span className="font-semibold text-neutral-900 dark:text-neutral-100">Finance</span>
      </a>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User Menu Dropdown */}
      <UserMenu userName={userName} avatarUrl={avatarUrl} onLogout={onLogout} />
    </header>
  );
});

MobileHeader.displayName = "MobileHeader";
