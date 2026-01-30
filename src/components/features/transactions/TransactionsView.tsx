import { useState } from "react";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { useTransactions } from "./hooks/useTransactions";
import { PageHeader } from "@/components/PageHeader";
import { TransactionsFilters } from "./TransactionsFilters";
import TransactionsList from "./components/TransactionsList";
import AddTransactionDialog from "./components/AddTransactionDialog";
import EditTransactionDialog from "./components/EditTransactionDialog";
import DeleteTransactionDialog from "./components/DeleteTransactionDialog";
import type { TransactionDTO } from "@/types";

function TransactionsViewContent() {
  const notify = useToast();
  const { transactions, pagination, filters, status, setFilters, setPage, addTransaction, updateTransaction, deleteTransaction } = useTransactions();

  const [editingTransaction, setEditingTransaction] = useState<TransactionDTO | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<TransactionDTO | null>(null);

  const handleAdd = async (command: any) => {
    try {
      await addTransaction(command);
      notify.success("Transakcja została dodana pomyślnie.");
    } catch (error) {
      notify.error("Nie udało się dodać transakcji.");
    }
  };

  const handleEdit = async (id: string, command: any) => {
    try {
      await updateTransaction(id, command);
      notify.success("Transakcja została zaktualizowana pomyślnie.");
    } catch (error) {
      notify.error("Nie udało się zaktualizować transakcji.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id);
      notify.success("Transakcja została usunięta pomyślnie.");
    } catch (error) {
      notify.error("Nie udało się usunąć transakcji.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader title="Historia transakcji" description="Przeglądaj i zarządzaj swoimi wydatkami i przychodami." />
        <AddTransactionDialog onAdd={handleAdd} />
      </div>

      <TransactionsFilters filters={filters} onFilterChange={setFilters} />

      <TransactionsList
        transactions={transactions}
        isLoading={status === "loading"}
        pagination={pagination}
        onPageChange={setPage}
        onEdit={setEditingTransaction}
        onDelete={setDeletingTransaction}
      />

      <EditTransactionDialog transaction={editingTransaction} open={!!editingTransaction} onOpenChange={(open) => !open && setEditingTransaction(null)} onEdit={handleEdit} />

      <DeleteTransactionDialog
        transaction={deletingTransaction}
        open={!!deletingTransaction}
        onOpenChange={(open) => !open && setDeletingTransaction(null)}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default function TransactionsView() {
  return (
    <ToastProvider>
      <TransactionsViewContent />
    </ToastProvider>
  );
}
