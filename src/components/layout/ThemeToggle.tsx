import React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ThemeToggleProps {
  /** Callback function to toggle dark mode */
  onToggle?: () => void;
  /** Optional CSS class for wrapper */
  className?: string;
  /** Size variant of the button */
  size?: "sm" | "default" | "lg" | "icon";
  /** Show text label */
  showLabel?: boolean;
}

/**
 * ThemeToggle Component
 *
 * Shared component for toggling between light and dark themes.
 * Used in both desktop (Sidebar) and mobile (UserMenu) contexts.
 */
export const ThemeToggle = React.memo(function ThemeToggle({
  onToggle,
  className,
  size = "default",
  showLabel = false,
}: ThemeToggleProps) {
  return (
    <Button
      onClick={onToggle}
      variant="outline"
      size={size}
      className={`justify-center gap-2 ${className || ""}`}
      aria-label="Toggle theme"
      title="Toggle between light and dark theme"
    >
      <Sun className="size-4 dark:hidden" />
      <Moon className="hidden size-4 dark:block" />
      {showLabel && <span className="text-sm">Motyw</span>}
    </Button>
  );
});

ThemeToggle.displayName = "ThemeToggle";
