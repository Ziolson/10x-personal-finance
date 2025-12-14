import React, { useCallback } from "react";
import { LogOut, Moon, Sun } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserMenuProps {
  /** User's display name or email */
  userName?: string;
  /** User's avatar URL */
  avatarUrl?: string;
  /** Callback function when logout is clicked */
  onLogout: () => Promise<void>;
  /** Callback function to toggle dark mode */
  onToggleDarkMode?: () => void;
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
  onToggleDarkMode,
}: UserMenuProps) {
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await onLogout();
      // TODO: Toast notification will be handled in logout implementation
    } catch {
      // TODO: Toast error notification will be handled in logout implementation
    } finally {
      setIsLoggingOut(false);
    }
  }, [onLogout]);

  const handleToggleDarkMode = useCallback(() => {
    if (onToggleDarkMode) {
      onToggleDarkMode();
    }
  }, [onToggleDarkMode]);

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

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span className="text-sm font-semibold">{userName}</span>
          <span className="text-xs font-normal text-neutral-500 dark:text-neutral-400">{userName}</span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {onToggleDarkMode && (
          <DropdownMenuItem onClick={handleToggleDarkMode} className="cursor-pointer">
            <div className="flex items-center gap-2">
              <Sun className="size-4" />
              <span>Jasny motyw</span>
            </div>
          </DropdownMenuItem>
        )}

        {onToggleDarkMode && (
          <DropdownMenuItem onClick={handleToggleDarkMode} className="cursor-pointer">
            <div className="flex items-center gap-2">
              <Moon className="size-4" />
              <span>Ciemny motyw</span>
            </div>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <div className="flex items-center gap-2">
            <LogOut className="size-4" />
            <span>{isLoggingOut ? "Wylogowywanie..." : "Wyloguj"}</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

UserMenu.displayName = "UserMenu";
