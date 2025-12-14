import React from "react";
import { useStore } from "@nanostores/react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { $resolvedTheme, toggleTheme } from "@/lib/stores/layoutStore";

interface ThemeToggleProps {
  /** Optional CSS class for wrapper */
  className?: string;
  /** Size variant of the button */
  size?: "sm" | "default" | "lg" | "icon";
  /** Show text label */
  showLabel?: boolean;
}

/**
 * ThemeToggle Component - Astro-native solution
 *
 *
 * @example
 * ```tsx
 * <ThemeToggle size="sm" showLabel />
 * ```
 */
export const ThemeToggle = React.memo(function ThemeToggle({
  className,
  size = "default",
  showLabel = false,
}: ThemeToggleProps) {
  const resolvedTheme = useStore($resolvedTheme);

  return (
    <Button
      onClick={toggleTheme}
      variant="outline"
      size={size}
      className={`justify-center gap-2 ${className || ""}`}
      aria-label="Toggle theme"
      title="Toggle between light and dark theme"
    >
      <Sun className="size-4 dark:hidden" aria-hidden="true" />
      <Moon className="hidden size-4 dark:block" aria-hidden="true" />
      {showLabel && <span className="text-sm">Motyw</span>}
      <span className="sr-only">Current theme: {resolvedTheme}</span>
    </Button>
  );
});

ThemeToggle.displayName = "ThemeToggle";
