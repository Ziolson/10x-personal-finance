import * as React from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { BudgetProgressItem as BudgetProgressItemType } from "@/types";

interface BudgetProgressItemProps {
  item: BudgetProgressItemType;
}

export function BudgetProgressItem({ item }: BudgetProgressItemProps) {
  const { budget_name, spent_amount, budget_amount, percentage_used } = item;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Using generic class if color not working dynamically with shadcn progress (shadcn progress usually uses primary)
  // To override, we might need a custom class or inline style on the indicator.
  // Shadcn Progress component implementation typically takes className for the root,
  // but changing variable for indicator might be needed.
  // Assuming standard implementation:

  let indicatorColorClass = "bg-primary";
  let textColorClass = "text-muted-foreground";

  if (percentage_used > 100) {
    indicatorColorClass = "bg-destructive"; // or red-500
    textColorClass = "text-destructive";
  } else if (percentage_used >= 80) {
    indicatorColorClass = "bg-yellow-500";
    textColorClass = "text-yellow-600";
  } else {
    indicatorColorClass = "bg-green-600";
  }

  // NOTE: Shadcn Progress component might not expose indicator styling easily via props.
  // We might need to wrap it or pass a custom class that targets the indicator if relying on CSS modules,
  // but with Tailwind we often need [&>div]:bg-color.

  const progressColorClass = `[&>div]:${indicatorColorClass}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{budget_name}</span>
        <span className={cn(textColorClass, "font-medium")}>
          {formatCurrency(spent_amount)} / {formatCurrency(budget_amount)}
        </span>
      </div>
      <Progress value={Math.min(percentage_used, 100)} className={cn("h-2", progressColorClass)} />
      <div className="flex justify-end text-xs text-muted-foreground">{percentage_used.toFixed(1)}%</div>
    </div>
  );
}
