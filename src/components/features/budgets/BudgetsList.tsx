import React from "react";
import BudgetListItem from "./BudgetListItem";
import EmptyState from "./EmptyState";
import BudgetSkeletonLoader from "./BudgetSkeletonLoader";
import type { BudgetDTO, CategoryDTO } from "@/types";

interface BudgetsListProps {
  budgets: BudgetDTO[];
  categories: CategoryDTO[];
  isLoading: boolean;
  onEdit: (budget: BudgetDTO) => void;
  onDelete: (budget: BudgetDTO) => void;
}

export default function BudgetsList({ 
  budgets, 
  categories,
  isLoading, 
  onEdit, 
  onDelete 
}: BudgetsListProps) {
  // Create a map for quick category lookup
  const categoriesMap = React.useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat.id] = cat;
      return acc;
    }, {} as Record<string, CategoryDTO>);
  }, [categories]);

  if (isLoading) {
    return <BudgetSkeletonLoader />;
  }

  if (budgets.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {budgets.map((budget) => (
        <BudgetListItem
          key={budget.id}
          budget={budget}
          categoriesMap={categoriesMap}
          onEdit={() => onEdit(budget)}
          onDelete={() => onDelete(budget)}
        />
      ))}
    </div>
  );
}
