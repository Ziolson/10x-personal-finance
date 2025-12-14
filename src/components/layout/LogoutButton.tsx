import React, { useCallback, useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogoutButtonProps {
  /** Callback function when logout is clicked */
  onLogout: () => Promise<void>;
  /** Optional CSS class for wrapper */
  className?: string;
  /** Size variant of the button */
  size?: "sm" | "default" | "lg";
  /** Show text label */
  showLabel?: boolean;
}

/**
 * LogoutButton Component
 *
 * Shared component for logout action.
 * Used in both desktop (Sidebar) and mobile (UserMenu) contexts.
 */
export const LogoutButton = React.memo(function LogoutButton({
  onLogout,
  className,
  size = "default",
  showLabel = true,
}: LogoutButtonProps) {
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

  return (
    <Button
      onClick={handleLogout}
      disabled={isLoggingOut}
      variant="destructive"
      size={size}
      className={`justify-center gap-2 ${className || ""}`}
      aria-label="Logout"
      title="Logout from application"
    >
      <LogOut className="size-4" />
      {showLabel && <span>{isLoggingOut ? "Wylogowywanie..." : "Wyloguj"}</span>}
    </Button>
  );
});

LogoutButton.displayName = "LogoutButton";
