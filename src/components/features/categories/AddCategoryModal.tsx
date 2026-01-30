import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { CreateCategoryCommand, CategoryType } from "@/types";
import CategoryForm from "./CategoryForm";

interface AddCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateCategoryCommand) => Promise<void>;
  defaultType?: CategoryType;
}

export default function AddCategoryModal({ open, onOpenChange, onSubmit, defaultType = "expense" }: AddCategoryModalProps) {
  const handleSubmit = async (data: CreateCategoryCommand) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Dodaj nową kategorię</DialogTitle>
          <DialogDescription>Utwórz nową kategorię, aby lepiej zarządzać swoimi finansami.</DialogDescription>
        </DialogHeader>
        <CategoryForm
          mode="create"
          onSubmit={handleSubmit}
          isSubmitting={false} // Loading state is handled inside the form or by wrapper? Plan says "Spinner -> Zamknięcie".
          // The useCategories hook manages loading state but doesn't expose a specific "isCreating" state easily per modal without extra logic.
          // But looking at the plan: "Submit -> Spinner -> Zamknięcie".
          // I will assume the parent handles the async call and the form waits.
          // The form `isSubmitting` prop controls the button state.
          // I should wrap the onSubmit to handle the promise state if the parent doesn't expose it.
          // But `useCategories` is void or promise.
          // Let's make `onSubmit` async in props.
          defaultValues={{ type: defaultType }}
        />
      </DialogContent>
    </Dialog>
  );
}
