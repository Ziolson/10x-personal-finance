import { Button } from "@/components/ui/button";
import DeleteConfirmationDialog from "@/components/features/accounts/DeleteConfirmationDialog";
import EmptyState from "@/components/features/accounts/EmptyState";
import AddAccountModal from "@/components/features/accounts/AddAccountModal";
import EditAccountModal from "@/components/features/accounts/EditAccountModal";
import AccountsList from "@/components/features/accounts/AccountsList";
import SkeletonLoader from "@/components/features/accounts/SkeletonLoader";
import { PageHeader } from "@/components/ui/PageHeader";
import useAccounts from "@/components/hooks/useAccounts";
import { ToastProvider, useToast } from "@/components/ui/toast";
import type { AccountDTO, AccountFormViewModel } from "@/types";
import { useState } from "react";

function AccountsViewContent() {
  const { accounts, isLoading, error, refetch, deleteAccount, createAccount, updateAccount } = useAccounts();
  const toast = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountDTO | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<AccountDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deletingAccount) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteAccount(deletingAccount.id);
      toast.success("Usunięto konto");
      setDeletingAccount(null);
    } catch (error) {
      const status = (error as Error & { status?: number }).status;
      const message = error instanceof Error ? error.message : "Nie udało się usunąć konta.";
      toast.error(message);
      if (status === 404) {
        void refetch();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateAccount = async (data: AccountFormViewModel) => {
    await createAccount(data);
    toast.success("Dodano konto");
  };

  const handleUpdateAccount = async (accountId: string, data: AccountFormViewModel) => {
    await updateAccount(accountId, data);
    toast.success("Zaktualizowano konto");
  };

  const renderContent = () => {
    if (isLoading) {
      return <SkeletonLoader />;
    }

    if (error) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
          <p className="font-semibold">Wystąpił błąd podczas ładowania kont.</p>
          <p className="mt-1">{error.message}</p>
          <Button className="mt-3" variant="outline" size="sm" onClick={() => refetch()}>
            Spróbuj ponownie
          </Button>
        </div>
      );
    }

    if (!accounts || accounts.length === 0) {
      return <EmptyState />;
    }

    return <AccountsList accounts={accounts} onEdit={setEditingAccount} onDelete={setDeletingAccount} />;
  };

  return (
    <section className="space-y-6">
      <PageHeader title="Twoje konta" description="Finanse">
        <Button onClick={() => setIsAddModalOpen(true)}>Dodaj konto</Button>
      </PageHeader>

      {renderContent()}

      <AddAccountModal
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSubmit={handleCreateAccount}
        onSuccess={() => {
          setIsAddModalOpen(false);
        }}
        onError={(message) => {
          if (message) toast.error(message);
        }}
      />

      <EditAccountModal
        isOpen={Boolean(editingAccount)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingAccount(null);
          }
        }}
        account={editingAccount}
        onSubmit={handleUpdateAccount}
        onSuccess={() => {
          setEditingAccount(null);
        }}
        onError={(message) => {
          if (message) toast.error(message);
        }}
      />

      <DeleteConfirmationDialog
        isOpen={Boolean(deletingAccount)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingAccount(null);
          }
        }}
        onConfirm={handleDeleteConfirm}
        account={deletingAccount}
        isDeleting={isDeleting}
      />
    </section>
  );
}

export default function AccountsView() {
  return (
    <ToastProvider>
      <AccountsViewContent />
    </ToastProvider>
  );
}
