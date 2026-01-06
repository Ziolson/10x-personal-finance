import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/PageHeader";
import { useBudgets } from "@/components/hooks/useBudgets";
import { useCategories } from "@/components/hooks/useCategories";
import BudgetsList from "@/components/features/budgets/BudgetsList";
import MonthNavigator from "@/components/features/budgets/MonthNavigator";
import AddBudgetModal from "@/components/features/budgets/AddBudgetModal";
import EditBudgetModal from "@/components/features/budgets/EditBudgetModal";
import DeleteConfirmationDialog from "@/components/features/budgets/DeleteConfirmationDialog";
import type { BudgetDTO, CreateBudgetCommand, UpdateBudgetCommand } from "@/types";

function BudgetsViewContent() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetDTO | null>(null);
  const [deletingBudget, setDeletingBudget] = useState<BudgetDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const month = currentDate.getMonth() + 1; // getMonth() returns 0-11
  const year = currentDate.getFullYear();

  const { budgets, isLoading, isError, error, refetch, createBudget, updateBudget, deleteBudget } =
    useBudgets({ month, year });

  const { categories, fetchCategories } = useCategories();
  const toast = useToast();

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const handleCreateBudget = async (data: CreateBudgetCommand) => {
    try {
      await createBudget(data);
      toast.success("Budżet został utworzony");
      setIsAddModalOpen(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił błąd";
      toast.error(`Nie udało się utworzyć budżetu: ${errorMessage}`);
      throw err; // Re-throw to keep modal open
    }
  };

  const handleUpdateBudget = async (data: UpdateBudgetCommand) => {
    if (!editingBudget) return;
    try {
      await updateBudget(editingBudget.id, data);
      toast.success("Budżet został zaktualizowany");
      setEditingBudget(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił błąd";
      toast.error(`Nie udało się zaktualizować budżetu: ${errorMessage}`);
      throw err; // Re-throw to keep modal open
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBudget) return;

    setIsDeleting(true);
    try {
      await deleteBudget(deletingBudget.id);
      toast.success("Budżet został usunięty");
      setDeletingBudget(null);
    } catch (err) {
      const status = (err as Error & { status?: number }).status;
      const message = err instanceof Error ? err.message : "Nie udało się usunąć budżetu.";
      toast.error(message);
      if (status === 404) {
        void refetch();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (isError) {
    return (
      <section className="space-y-6">
        <PageHeader title="Budżety" description="Finanse" />
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
          <p className="font-semibold">Wystąpił błąd podczas ładowania budżetów.</p>
          <p className="mt-1">{error?.message}</p>
          <Button className="mt-3" variant="outline" size="sm" onClick={() => refetch()}>
            Spróbuj ponownie
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <PageHeader title="Budżety" description="Finanse">
        <Button onClick={() => setIsAddModalOpen(true)}>Dodaj budżet</Button>
      </PageHeader>

      <MonthNavigator currentDate={currentDate} onDateChange={setCurrentDate} />

      <BudgetsList
        budgets={budgets}
        categories={categories}
        isLoading={isLoading}
        onEdit={setEditingBudget}
        onDelete={setDeletingBudget}
      />

      <AddBudgetModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSubmit={handleCreateBudget}
        month={month}
        year={year}
        availableCategories={categories}
        existingBudgets={budgets}
      />

      <EditBudgetModal
        open={!!editingBudget}
        onOpenChange={(open) => !open && setEditingBudget(null)}
        onSubmit={handleUpdateBudget}
        budget={editingBudget}
        availableCategories={categories}
        existingBudgets={budgets}
      />

      <DeleteConfirmationDialog
        isOpen={!!deletingBudget}
        onOpenChange={(open) => !open && setDeletingBudget(null)}
        onConfirm={handleDeleteConfirm}
        budget={deletingBudget}
        isDeleting={isDeleting}
      />
    </section>
  );
}

export default function BudgetsView() {
  return (
    <ToastProvider>
      <BudgetsViewContent />
    </ToastProvider>
  );
}
