import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./ThemeToggle";
import { LogoutButton } from "./LogoutButton";

interface UserMenuProps {
  /** User's display name or email */
  userName?: string;
  /** User's avatar URL */
  avatarUrl?: string;
  /** Callback function when logout is clicked */
  onLogout: () => Promise<void>;
}

/**
 * UserMenu Component - Mobile/Dropdown Version
 *
 * Dropdown menu containing user profile options, theme toggle, and logout.
 * Used in MobileHeader and can be integrated with Sidebar for consistent UX.
 */
export const UserMenu = React.memo(function UserMenu({
  userName = "User",
  avatarUrl,
  onLogout,
}: UserMenuProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
          aria-label="Open user menu"
        >
          <Avatar className="size-8">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={userName} />}
            <AvatarFallback>{getInitials(userName)}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 p-4">
        <DropdownMenuLabel className="mb-3 flex flex-col gap-1">
          <span className="text-sm font-semibold">{userName}</span>
          <span className="text-xs font-normal text-neutral-500 dark:text-neutral-400">{userName}</span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="mb-3" />

        {/* Theme Toggle */}
        <div className="mb-3">
          <ThemeToggle className="w-full" size="sm" showLabel />
        </div>

        <DropdownMenuSeparator className="mb-3" />

        {/* Logout Button */}
        <div>
          <LogoutButton onLogout={onLogout} className="w-full" size="sm" showLabel />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

UserMenu.displayName = "UserMenu";
