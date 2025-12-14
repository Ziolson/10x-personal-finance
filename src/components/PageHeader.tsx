import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  /** Main title of the page */
  title: string;
  /** Optional description or breadcrumb text */
  description?: string;
  /** Optional action buttons or elements */
  children?: React.ReactNode;
  /** Optional CSS class for wrapper */
  className?: string;
}

/**
 * PageHeader Component
 *
 * Reusable component for displaying page headers with title, description, and action buttons.
 * Provides consistent styling and layout across all views.
 *
 * Example:
 * ```tsx
 * <PageHeader title="Your Accounts" description="Finance">
 *   <Button onClick={...}>Add Account</Button>
 * </PageHeader>
 * ```
 */
export const PageHeader = React.memo(function PageHeader({
  title,
  description,
  children,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("flex flex-wrap items-center justify-between gap-4 md:gap-6", className)}>
      <div className="flex-1">
        {description && (
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            {description}
          </p>
        )}
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 md:text-3xl">
          {title}
        </h1>
      </div>

      {children && <div className="flex flex-wrap items-center gap-2 md:gap-3">{children}</div>}
    </header>
  );
});

PageHeader.displayName = "PageHeader";
