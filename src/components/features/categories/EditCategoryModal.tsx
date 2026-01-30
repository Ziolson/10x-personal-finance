import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { CategoryDTO, CreateCategoryCommand } from "@/types";
import CategoryForm from "./CategoryForm";

interface EditCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryDTO | null;
  onSubmit: (data: CreateCategoryCommand) => Promise<void>;
}

export default function EditCategoryModal({ open, onOpenChange, category, onSubmit }: EditCategoryModalProps) {
  const handleSubmit = async (data: CreateCategoryCommand) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  if (!category) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edytuj kategorię</DialogTitle>
          <DialogDescription>Zmień nazwę kategorii. Typu kategorii nie można zmienić.</DialogDescription>
        </DialogHeader>
        <CategoryForm
          mode="edit"
          onSubmit={handleSubmit}
          isSubmitting={false} // Similar note as AddCategoryModal, wrapper should handle loading or pass it down.
          // For now I'll use local state in Form or just let React Hook Form handle `isSubmitting`?
          // React Hook Form's `isSubmitting` is true while the async `onSubmit` is running.
          // So passing `onSubmit` that returns a promise is enough!
          defaultValues={{
            name: category.name,
            type: category.type,
            budget_id: category.budget_id,
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
