import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import BudgetForm from "./BudgetForm";
import type { UpdateBudgetCommand, CategoryDTO, BudgetDTO } from "@/types";

interface EditBudgetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UpdateBudgetCommand) => Promise<void>;
  budget: BudgetDTO | null;
  availableCategories: CategoryDTO[];
  existingBudgets: BudgetDTO[];
}

export default function EditBudgetModal({
  open,
  onOpenChange,
  onSubmit,
  budget,
  availableCategories,
  existingBudgets,
}: EditBudgetModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!budget) {
    return null;
  }

  // Calculate used category IDs from OTHER budgets (exclude current budget)
  const usedCategoryIds = existingBudgets
    .filter((b) => b.id !== budget.id)
    .flatMap((b) => b.categories);

  const handleSubmit = async (data: Omit<UpdateBudgetCommand, "month" | "year">) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edytuj budżet</DialogTitle>
          <DialogDescription>
            Zaktualizuj informacje o budżecie lub przypisane kategorie.
          </DialogDescription>
        </DialogHeader>
        <BudgetForm
          mode="edit"
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          availableCategories={availableCategories}
          usedCategoryIds={usedCategoryIds}
          currentBudgetCategoryIds={budget.categories}
          defaultValues={{
            name: budget.name,
            amount: budget.amount,
            category_ids: budget.categories,
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
