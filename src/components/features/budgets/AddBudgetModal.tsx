import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import BudgetForm from "./BudgetForm";
import type { CreateBudgetCommand, CategoryDTO, BudgetDTO } from "@/types";

interface AddBudgetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateBudgetCommand) => Promise<void>;
  month: number;
  year: number;
  availableCategories: CategoryDTO[];
  existingBudgets: BudgetDTO[];
}

export default function AddBudgetModal({ open, onOpenChange, onSubmit, month, year, availableCategories, existingBudgets }: AddBudgetModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate used category IDs from existing budgets (excluding this budget since it's new)
  const usedCategoryIds = existingBudgets.flatMap((b) => b.categories);

  const handleSubmit = async (data: Omit<CreateBudgetCommand, "month" | "year">) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...data,
        month,
        year,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Dodaj nowy budżet</DialogTitle>
          <DialogDescription>Utwórz budżet dla wybranych kategorii w bieżącym miesiącu.</DialogDescription>
        </DialogHeader>
        <BudgetForm mode="create" onSubmit={handleSubmit} isSubmitting={isSubmitting} availableCategories={availableCategories} usedCategoryIds={usedCategoryIds} />
      </DialogContent>
    </Dialog>
  );
}
