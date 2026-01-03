import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/PageHeader";
import { useCategories } from "@/components/hooks/useCategories";
import CategoriesList from "@/components/features/categories/CategoriesList";
import AddCategoryModal from "@/components/features/categories/AddCategoryModal";
import EditCategoryModal from "@/components/features/categories/EditCategoryModal";
import DeleteCategoryDialog from "@/components/features/categories/DeleteCategoryDialog";
import type { CategoryDTO, CreateCategoryCommand, CategoryType } from "@/types";

function CategoriesViewContent() {
  const { categories, isLoading, isError, error, fetchCategories, addCategory, updateCategory, deleteCategory } =
    useCategories();

  const toast = useToast();
  const [activeTab, setActiveTab] = useState<CategoryType>("expense");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDTO | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CategoryDTO | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Filter categories based on active tab
  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  const handleAddCategory = async (data: CreateCategoryCommand) => {
    setIsProcessing(true);
    try {
      await addCategory(data);
      toast.success("Kategoria została dodana");
      setIsAddModalOpen(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił błąd";
      if (errorMessage === "CATEGORY_NAME_EXISTS") {
        toast.error("Kategoria o takiej nazwie już istnieje");
      } else {
        toast.error("Nie udało się dodać kategorii");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditCategory = async (data: CreateCategoryCommand) => {
    if (!editingCategory) return;
    setIsProcessing(true);
    try {
      await updateCategory(editingCategory.id, {
        name: data.name,
        budget_id: data.budget_id,
      });
      toast.success("Kategoria została zaktualizowana");
      setEditingCategory(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił błąd";
      if (errorMessage === "CATEGORY_NAME_EXISTS") {
        toast.error("Kategoria o takiej nazwie już istnieje");
      } else {
        toast.error("Nie udało się zaktualizować kategorii");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    setIsProcessing(true);
    try {
      await deleteCategory(deletingCategory.id);
      toast.success("Kategoria została usunięta");
      setDeletingCategory(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił błąd";
      if (errorMessage === "CATEGORY_HAS_TRANSACTIONS") {
        toast.error("Nie można usunąć kategorii, ponieważ są do niej przypisane transakcje");
      } else {
        toast.error("Nie udało się usunąć kategorii");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (isError) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
        <p className="text-destructive">Wystąpił błąd podczas pobierania kategorii: {error}</p>
        <Button onClick={fetchCategories}>Spróbuj ponownie</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Kategorie" description="Zarządzaj kategoriami wydatków i przychodów">
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Dodaj kategorię
        </Button>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CategoryType)}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="expense">Wydatki</TabsTrigger>
          <TabsTrigger value="income">Przychody</TabsTrigger>
        </TabsList>
        <TabsContent value="expense" className="mt-6">
          <CategoriesList
            categories={expenseCategories}
            isLoading={isLoading}
            onEdit={setEditingCategory}
            onDelete={setDeletingCategory}
          />
        </TabsContent>
        <TabsContent value="income" className="mt-6">
          <CategoriesList
            categories={incomeCategories}
            isLoading={isLoading}
            onEdit={setEditingCategory}
            onDelete={setDeletingCategory}
          />
        </TabsContent>
      </Tabs>

      <AddCategoryModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSubmit={handleAddCategory}
        defaultType={activeTab}
      />

      <EditCategoryModal
        open={!!editingCategory}
        onOpenChange={(open) => !open && setEditingCategory(null)}
        category={editingCategory}
        onSubmit={handleEditCategory}
      />

      <DeleteCategoryDialog
        open={!!deletingCategory}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
        category={deletingCategory}
        onConfirm={handleDeleteCategory}
        isDeleting={isProcessing}
      />
    </div>
  );
}

export default function CategoriesView() {
  return (
    <ToastProvider>
      <CategoriesViewContent />
    </ToastProvider>
  );
}
